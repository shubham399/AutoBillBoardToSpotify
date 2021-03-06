var request = require('request'); // "Request" library
var JSSoup = require('jssoup').default;
var cache = require('./utils/cache.js')
var data = "do shash'owania";
var crypto = require('crypto');
let keyTTL = parseInt(process.env.KEY_TTL) || 604800; // Keep Song for 7 days in redis.

const search = async function(spotifyApi,song)
{
  let key = crypto.createHash('md5').update(song).digest("hex");
  let id = await cache.get(key)
  if(!id){
    id = await searchExternal(spotifyApi,song)
    // Cache the id
    if(id){
      await cache.setex(key,id,keyTTL);
      console.log(`${song} Got from external.`);
    }
    else{
      console.log(`Unable to find ${song}`);
    }
  }
  else {
    console.log(`${song} Got from cache.`);
  }
  return id;
}

const searchExternal = async function(spotifyApi, song) {
    try {
        var data = await spotifyApi.search(song, ["track"], {
            best_match: true
        });
        var id = data.body.best_match.items[0].id;
        return id;

    } catch (err) {
        return null;
    }
}

const addBulkSongs = async function(spotifyApi, songs) {
    try {
        // console.log(songs);
        var date = new Date().toDateString();
        var data = await spotifyApi.getMe();
        var id = data.body.id;
        var playlist = await spotifyApi.createPlaylist(id, "Billboard TOP 100 on " + date, {
            'public': false
        });
        var idsF = await Promise.all(songs.map(x => search(spotifyApi, x)))
        let ids = idsF.filter(y => y != null).map(x => ("spotify:track:" + x));
        let addedSongs = await spotifyApi.addTracksToPlaylist(playlist.body.id, ids.slice(0, 100));
    } catch (err) {
        console.log("Error in Bulk Add: " + err);
    }
};

const currentLibIds = async function(spotifyApi) {
    var list = await (spotifyApi.getMySavedTracks({
        limit: 50
    }));
    var ids = list.body.items.map(x => x.track.id);
    var total = list.body.total;
    console.log("TOTAL:" + total);

    for (var i = 50; i < (total + 50); i += 50) {
        var l = await (spotifyApi.getMySavedTracks({
            limit: 50,
            offset: i
        }));
        var nIds = l.body.items.map(x => x.track.id);
        ids = ids.concat(nIds);
    }

    return ids;

}

const scrapeAndAdd = function(spotifyApi) {
    request('https://www.billboard.com/charts/hot-100', function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        if (error == null) {
            const dom = new JSSoup(body);
            var dms = dom.findAll("span", {
                "class": "chart-element__information"
            });
            var songs = [];
            for (dm of dms) {
                // let d = new JSSoup(dm);
                let titleSpan = dm.find('span')
                let title = titleSpan.text.trim()
                let artist = titleSpan.findNextSibling('span').text.trim()
                songs.push('track:' +title+' artist:'+artist)
            }
            addBulkSongs(spotifyApi, songs)
        }
    });
};

exports.search = search;
exports.addBulkSongs = addBulkSongs;
exports.currentLibIds = currentLibIds;
exports.scrapeAndAdd = scrapeAndAdd;

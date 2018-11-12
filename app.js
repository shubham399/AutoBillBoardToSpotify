const async = require("asyncawait/async");
const await = require("asyncawait/await");
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var SpotifyWebApi = require('spotify-web-api-node');
var state = 'spotify_auth_state';
var sleep = require('sleep');
var code = null;
var app = express();

var jsdom = require("jsdom");
const {
  JSDOM
} = jsdom;

// app.use(cors())
var scopes = ["user-library-modify","user-read-private","user-library-read","user-read-email","playlist-modify-private"]
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.APP_URI + "/callback"
});
app.get("/start", async(function(req, res) {
  console.log("Start API called.");
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  if (code == null)
    res.redirect(authorizeURL);
  else {
     try{
    var data = await(spotifyApi.getMe());
     console.log(data.body);
     sleep.sleep(1);
     await(scrapeAndAdd());
     refresh();     
     res.send(data.body);
     }
    catch(err)
    {
       console.log("ERROR at getUser:", err);
        res.redirect(authorizeURL);
    }
  }
}))


// console.log(authorizeURL);

app.get('/callback', function(req, res) {
  console.log("Got Callback.")
  code = req.query.code || null;

  spotifyApi.authorizationCodeGrant(req.query.code).then(data => {
    console.log('The token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);
    console.log('The refresh token is ' + data.body['refresh_token']);
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);
    res.redirect("/start");
  }).catch(err => {
    console.log(err);
    res.send("Something Went Wrong.")
  })
});

app.all("/",function(req,res){
  res.send("AutoBillBoard");
});
app.all('*', function(req, res){
  res.send('what???', 404);
});


console.log('Listening on '+ process.env.PORT);
app.listen(process.env.PORT);

function refresh() {
  try {
    spotifyApi.refreshAccessToken().then(
      function(data) {
        console.log('The access token has been refreshed!');
        spotifyApi.setAccessToken(data.body['access_token']);
      },
      function(err) {
        console.log('Could not refresh access token', err);
      }

    );
  } catch (err) {}
}

function scrapeAndAdd() {
  console.log("SCRAPPING Started.")
  request('https://www.billboard.com/charts/hot-100', function(error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    if (error == null) {
      const dom = new JSDOM(body);
      var one = dom.window.document.getElementsByClassName("chart-number-one__title")[0].innerHTML.replace("\n", "").trim()
      var dms = dom.window.document.getElementsByClassName("chart-list-item__title-text");
      var songs = [one];
      for (var i = 0; i < dms.length; i++) {
        songs.push(dms[i].innerHTML.replace("\n", "").trim())
      }
      addBulkSongs(songs)
    }
  });
  console.log("SCRAPPING ENDED.")
}

const addBulkSongs = async(function (songs) {
  var ids = songs.map(x=>{sleep.sleep(5);search(x)});
    console.log("adding " +ids+ "Saved tracks");
    while(ids.length > 50){
      var i = ids.slice(0,50);
    var added = await(spotifyApi.addToMySavedTracks(i));
      ids = ids.slice(50);
    }
  var added = await(spotifyApi.addToMySavedTracks(ids));
});
  

const search = async(function (song) {
  console.log("Adding " + song);
try{
  var data = await(spotifyApi.search(song, ["track"], {
    best_match: true
  }));
  var id = data.body.best_match.items[0].id;
  return id;
  
}
catch(err)
{
   console.log("Error while Searching Song"+err);
  return null;
}
  
  
})

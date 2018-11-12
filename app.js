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
var scopes = ["user-library-modify","user-read-email","playlist-modify-private"]
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.APP_URI + "/callback"
});
app.get("/start", function(req, res) {
  console.log("Start API called.");
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  if (code == null)
    res.redirect(authorizeURL);
  else {
    spotifyApi.getMe()
      .then(function(data) {
        refresh();
        scrapeAndAdd()
        // searchAndAdd('sex Eden')
        // console.log('Some information about the authenticated user', data.body);
        res.send(data.body)

      }, function(err) {
        console.log("ERROR at getUser:", err);
        res.redirect(authorizeURL);
      });
  }
})


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
        spotifyApi.resetAccessToken(data.body['access_token']);
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
        //songs.push(dms[i].innerHTML.replace("\n", "").trim())
      }
      addBulkSongs(songs)
    }
  });
  console.log("SCRAPPING ENDED.")
}

function addBulkSongs(songs) {
  songs.map(searchAndAdd)
}

const searchAndAdd = async(function (song) {
  console.log("Adding " + song);
try{
  var data = await(spotifyApi.search(song, ["track"], {
    best_match: true
  }));
  var id = data.body.best_match.items[0].id;
  var added = await(spotifyApi.addToMySavedTracks([id]));
}
catch(err)
{
   console.log("Error while Adding Song"+err);
}
 // spotifyApi.search(song, ["track"], {
 //   best_match: true
  //}).then(
    //function(data) {
      //const id = data.body.best_match.items[0].id;
      //spotifyApi.addToMySavedTracks([id]).then(v => {
       // console.log("Added song " + song);
      //}).catch(err => {
//         console.log("Unable to add " + song)
//       })

//     }).catch(
//     function(err) {
//       console.log(err);
//       console.error("Unable to find " + song);
//     }

//   );
  console.log("Added  " + song + " Completed.");
  sleep.sleep(5);
})

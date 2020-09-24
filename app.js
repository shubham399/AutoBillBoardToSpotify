var express = require('express'); // Express web server framework

var querystring = require('querystring');
var SpotifyWebApi = require('spotify-web-api-node');
var state = 'spotify_auth_state';
var sleep = require('sleep');
var code = null;
var app = express();
var port = process.env.PORT || 8080
let search = require('./spotify').search
let addBulkSongs = require('./spotify').addBulkSongs
let scrapeAndAdd = require('./spotify').scrapeAndAdd
let currentLibIds = require('./spotify').currentLibIds

// app.use(cors())
var scopes = ["user-library-modify", "user-read-private", "playlist-modify-private", "user-library-read", "user-read-email", "playlist-modify-private"]
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.APP_URI + "/callback"
});

console.log( process.env.CLIENT_ID);

app.get("/me", async function(req, res) {
  try {
    var data = await (spotifyApi.getMe());
    res.send(data);
  } catch (e) {
    res.send(e);
  }
});

app.get("/start", async function(req, res) {
  console.log("Start API called.");
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  if (code == null)
    res.redirect(authorizeURL);
  else {
    try {
      var data = await (spotifyApi.getMe());
      console.log(data.body);
      sleep.sleep(1);
      await (scrapeAndAdd(spotifyApi));
      res.send(data.body);
    } catch (err) {
      console.log("ERROR at getUser:", err);
      res.redirect(authorizeURL);
    }
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

app.all("/", function(req, res) {
  res.send("AutoBillBoard");
});
app.all('*', function(req, res) {
  res.status(404).send('what???');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

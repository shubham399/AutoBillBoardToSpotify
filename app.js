var express = require('express'); // Express web server framework
let cookieParser = require('cookie-parser')
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
app.use(cookieParser())
var scopes = ["user-library-modify", "user-read-private", "playlist-modify-private", "user-library-read", "user-read-email", "playlist-modify-private"]

app.get("/me", async function(req, res) {
    try {
      let spotifyApi = new SpotifyWebApi({
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          redirectUri: process.env.APP_URI + "/callback"
      });
      spotifyApi.setAccessToken(req.cookies['access_token']);
      spotifyApi.setRefreshToken(req.cookies['refresh_token']);
        var data = await (spotifyApi.getMe());
        res.send(data);
    } catch (e) {
        res.send(e);
    }
});

app.get("/start", async function(req, res) {
    console.log("Start API called.");
    let spotifyApi = new SpotifyWebApi({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.APP_URI + "/callback"
    });
    spotifyApi.setAccessToken(req.cookies['access_token']);
    spotifyApi.setRefreshToken(req.cookies['refresh_token']);
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
    let spotifyApi = new SpotifyWebApi({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.APP_URI + "/callback"
    });
    spotifyApi.authorizationCodeGrant(req.query.code).then(data => {
        console.log('The token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        console.log('The refresh token is ' + data.body['refresh_token']);
        res.cookie('access_token', data.body['access_token'], {
            httpOnly: true
        })
        res.cookie('refresh_token', data.body['refresh_token'], {
            httpOnly: true
        })
        res.cookie('expire_in', data.body['expires_in'], {
            httpOnly: true
        })
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

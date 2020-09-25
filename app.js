let express = require('express'); // Express web server framework
let cookieParser = require('cookie-parser')
let querystring = require('querystring');
let SpotifyWebApi = require('spotify-web-api-node');
let state = 'spotify_auth_state';
let sleep = require('sleep');
let app = express();
let port = process.env.PORT || 8080
let search = require('./spotify').search
let addBulkSongs = require('./spotify').addBulkSongs
let scrapeAndAdd = require('./spotify').scrapeAndAdd
let currentLibIds = require('./spotify').currentLibIds
let flash = require('connect-flash');
let session = require('express-session')

app.set('views', './views') // specify the views directory
app.set('view engine', 'ejs') // register the template engine

app.use(cookieParser('haldsuuuuuuuuuuuuuuuuuuuuuuugiasiugdsiuggfiugfdiug'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
let scopes = ["user-library-modify", "user-read-private", "playlist-modify-private", "user-library-read", "user-read-email", "playlist-modify-private"]

app.get("/me", async function(req, res) {
    try {
        let spotifyApi = new SpotifyWebApi({
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            redirectUri: process.env.APP_URI + "/callback"
        });
        spotifyApi.setAccessToken(req.cookies['access_token']);
        spotifyApi.setRefreshToken(req.cookies['refresh_token']);
        let data = await (spotifyApi.getMe());
        let added = req.flash('added')[0] || false
        res.render("home", {
            name: data.body.display_name,
            email: data.body.email,
            added

        });

    } catch (e) {
        console.error("ERROR:",e.message);
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        // req.flash("error",e.message)
        res.redirect('/');
    }
});
app.get("/add", async function(req, res) {
    try {
        let spotifyApi = new SpotifyWebApi({
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            redirectUri: process.env.APP_URI + "/callback"
        });
        spotifyApi.setAccessToken(req.cookies['access_token']);
        spotifyApi.setRefreshToken(req.cookies['refresh_token']);

        // scrapeAndAdd(spotifyApi)
        req.flash('added',true)
        res.redirect("/me")
    } catch (e) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.redirect('/');
    }
});

app.all("/login", async function(req, res) {
    console.log("Login Started");
    let spotifyApi = new SpotifyWebApi({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.APP_URI + "/callback"
    });
    let authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
})
app.get("/logout", async function(req, res) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.redirect("/")
})


// console.log(authorizeURL);

app.get('/callback', function(req, res) {
    console.log("Got Callback.")
    let spotifyApi = new SpotifyWebApi({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: process.env.APP_URI + "/callback"
    });
    spotifyApi.authorizationCodeGrant(req.query.code).then(data => {
        res.cookie('access_token', data.body['access_token'], {
            httpOnly: true
        })
        res.cookie('refresh_token', data.body['refresh_token'], {
            httpOnly: true
        })
        res.cookie('expire_in', data.body['expires_in'], {
            httpOnly: true
        })
        res.redirect("/me");
    }).catch(err => {
        console.log(err);
        res.send("Something Went Wrong.")
    })
});

app.all("/", function(req, res) {
    if (req.cookies['access_token']) {
        res.redirect("/me")
    } else
        res.render('index', {
            title: 'Hey',
            message: 'Hello there!'
        })
});
app.use('/styles',express.static('views/styles'))
app.all('*', function(req, res) {
    res.status(404).send('what???');
});

app.listen(port, () => {
    console.log(`Auto Billboard is listening on: ${port}`)
})

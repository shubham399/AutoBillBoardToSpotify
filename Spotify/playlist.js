const getPlaylists = async function(spotify) {
    try {
        let playlist = await spotify.getUserPlaylists(options = {
            private: true,
            collaborative: true
        })
        let items = playlist.body.items
        let playlists = items.map((x) => {
            let result = {
                id: x.id,
                name: x.name,
                songs: x.tracks.total
            }
            return result
        })
        return playlists
    } catch (e) {
        console.error(e.message);
        return []
    }
}

const getPlaylist = async function(spotify, id) {
    try {
        let tracks = await spotify.getPlaylistTracks(id)
        let data = tracks.body.items.map((x) => {
            return {
                name: x.track.name,
                artist: x.track.artists.map(x => x.name),
                album: x.track.album.name
            }
        })
        return data


    } catch (e) {
        console.error(e.message);
        return {}
    }
}

exports.getPlaylists = getPlaylists;
exports.getPlaylist = getPlaylist;

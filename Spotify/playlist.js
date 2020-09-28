
const getPlaylists = async function(spotify){
  try{
  let playlist = await spotify.getUserPlaylists(options={private:true,collaborative:true})
  let items = playlist.body.items
  let playlists = items.map ((x)=>{
    let result = {id:x.id,name:x.name,songs:x.tracks.total}
    return result
  })
  return playlists
}catch(e){
  console.error(e.message);
  return []
}
}

exports.getPlaylists = getPlaylists;

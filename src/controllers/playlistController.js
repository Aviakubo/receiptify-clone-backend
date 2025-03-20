// backend/src/controllers/playlistController.js
const spotifyApi = require('../utils/spotifyClient');
const fetch = require('node-fetch');

// Create a new playlist
exports.createPlaylist = async (req, res) => {
  const { access_token, user_id, name, description = '', public = true } = req.body;
  
  console.log("Create Playlist Request:", { user_id, name, description, public });
  
  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }
  
  try {
    let actualUserId = user_id;
    
    if(!actualUserId) {
      console.log("No user_id provided, retrieving from Spotify API");
      
      // Get user profile using direct fetch instead of the library
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error(`Failed to get user profile: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      actualUserId = userData.id;
      console.log('Retrieved user ID from token:', actualUserId);
    }
    
    if (!name) {
      return res.status(400).json({ error: "Playlist name is required" });
    }
    
    console.log("About to create playlist with parameters:", {
      userId: actualUserId,
      name,
      description,
      public
    });
    
    // Create playlist using direct fetch
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${actualUserId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        public
      })
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Spotify API error:', errorData);
      throw new Error(`Failed to create playlist: ${createResponse.status}`);
    }
    
    const playlistData = await createResponse.json();
    console.log('Playlist created successfully:', playlistData.name);
    
    res.json({
      playlist_id: playlistData.id,
      external_url: playlistData.external_urls.spotify
    });
    
  } catch (error) {
    console.error('Error creating playlist:', error);
    
    res.status(500).json({ 
      error: 'Failed to create playlist', 
      message: error.message 
    });
  }
};

// Add tracks to a playlist
exports.addTracksToPlaylist = async (req, res) => {
  const { access_token, playlist_id, track_uris } = req.body;
  
  if (!playlist_id || !track_uris || !track_uris.length) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    // Add tracks in batches (Spotify limit: 100 tracks per request)
    const batchSize = 100;
    
    for (let i = 0; i < track_uris.length; i += batchSize) {
      const batch = track_uris.slice(i, i + batchSize);
      await spotifyApi.addTracksToPlaylist(playlist_id, batch);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    res.status(400).json({ error: 'Failed to add tracks to playlist' });
  }
};
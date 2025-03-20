// backend/src/controllers/userDataController.js
const spotifyApi = require('../utils/spotifyClient');

// Get the user's top tracks
exports.getTopTracks = async (req, res) => {
  const { access_token, time_range = 'medium_term', limit = 50 } = req.query;
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    const data = await spotifyApi.getMyTopTracks({
      time_range, // short_term: 4 weeks, medium_term: 6 months, long_term: years
      limit,
      offset: 0
    });
    
    const topTracks = data.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      popularity: track.popularity,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_url.spotify
    }));
    
    res.json({ tracks: topTracks });
    
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(400).json({ error: 'Failed to fetch top tracks' });
  }
};

// Get the user's top artists
exports.getTopArtists = async (req, res) => {
  const { access_token, time_range = 'medium_term', limit = 20 } = req.query;
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    const data = await spotifyApi.getMyTopArtists({
      time_range,
      limit,
      offset: 0
    });
    
    const topArtists = data.body.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      image: artist.images[0]?.url,
      external_url: artist.external_url.spotify
    }));
    
    res.json({ artists: topArtists });
    
  } catch (error) {
    console.error('Error fetching top artists:', error);
    res.status(400).json({ error: 'Failed to fetch top artists' });
  }
};

// Get recently played tracks
exports.getRecentlyPlayed = async (req, res) => {
  const { access_token, limit = 50 } = req.query;
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    const data = await spotifyApi.getMyRecentlyPlayedTracks({
      limit
    });
    
    const recentTracks = data.body.items.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map(artist => artist.name).join(', '),
      album: item.track.album.name,
      played_at: item.played_at,
      image: item.track.album.images[0]?.url,
      preview_url: item.track.preview_url,
      external_url: item.track.external_url.spotify
    }));
    
    res.json({ tracks: recentTracks });
    
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    res.status(400).json({ error: 'Failed to fetch recently played tracks' });
  }
};

// Get track audio features (for deeper analysis)
exports.getTracksAudioFeatures = async (req, res) => {
  const { access_token, track_ids } = req.query;
  
  if (!track_ids) {
    return res.status(400).json({ error: 'No track IDs provided' });
  }
  
  const ids = Array.isArray(track_ids) ? track_ids : track_ids.split(',');
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    // Process in batches of 100 (Spotify API limit)
    const batchSize = 100;
    let audioFeatures = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const data = await spotifyApi.getAudioFeaturesForTracks(batch);
      audioFeatures = [...audioFeatures, ...data.body.audio_features];
    }
    
    res.json({ audio_features: audioFeatures });
    
  } catch (error) {
    console.error('Error fetching audio features:', error);
    res.status(400).json({ error: 'Failed to fetch audio features' });
  }
};

exports.getUserProfile = async (req, res) => {
  const { access_token } = req.body;

  if(!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const response = await spotifyApi.getMe();
    res.json(response.body);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(400).json({ error: 'Failed to fetch user profile' });
  }
};
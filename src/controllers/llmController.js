// backend/src/controllers/llmController.js
const spotifyApi = require('../utils/spotifyClient');
const axios = require('axios'); // Make sure axios is installed and imported
require('dotenv').config(); // Ensure environment variables are loaded

// Local implementation of formatSpotifyData
const formatSpotifyData = (data) => {
  const { topTracks, topArtists, audioFeatures = [] } = data;
  
  // Format top tracks for LLM consumption
  const formattedTracks = topTracks.map((track, index) => {
    // Find matching audio features if available
    const features = audioFeatures.find(f => f && f.id === track.id) || {};
    
    return {
      rank: index + 1,
      name: track.name,
      artist: track.artist,
      popularity: track.popularity,
      danceability: features.danceability || null,
      energy: features.energy || null,
      valence: features.valence || null,
      acousticness: features.acousticness || null,
      instrumentalness: features.instrumentalness || null,
      tempo: features.tempo || null
    };
  });
  
  // Format top artists with their genres
  const formattedArtists = topArtists.map((artist, index) => ({
    rank: index + 1,
    name: artist.name,
    genres: artist.genres || [],
    popularity: artist.popularity
  }));
  
  return {
    tracks: formattedTracks,
    artists: formattedArtists
  };
};

// Fallback function if the API call fails
const generateMockAnalysis = (data) => {
  // Extract some basic stats from the data
  const topArtist = data.artists[0]?.name || "Unknown";
  const topTrack = data.tracks[0]?.name || "Unknown";
  const topTrackArtist = data.tracks[0]?.artist || "Unknown";
  
  // Get genres from top artists
  const allGenres = data.artists.flatMap(artist => artist.genres || []);
  const uniqueGenres = [...new Set(allGenres)];
  const topGenres = uniqueGenres.slice(0, 5).join(", ") || "Various genres";
  
  return `
# Music Taste Analysis

## Music Personality
You're a diverse listener with an appreciation for ${topGenres}.

## Main Genres
Based on your top artists, you enjoy:
- ${uniqueGenres[0] || "Pop"}: 35%
- ${uniqueGenres[1] || "Rock"}: 25% 
- ${uniqueGenres[2] || "Hip Hop"}: 20%
- Other genres: 20%

## Mood Analysis
Your music selection suggests you enjoy music that's emotionally varied and engaging.

## Hidden Gems
You have some interesting tracks in your collection that aren't mainstream hits.

## Music Receipt
===============================
SPOTIFY MUSIC TASTE RECEIPT
===============================
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
-------------------------------
Items:
Favorite Artist: ${topArtist}
Top Track: ${topTrack} by ${topTrackArtist}
Music Variety: ${data.artists.length} different artists
Unique Genres: ${uniqueGenres.length}
-------------------------------
Total Emotional Value: Priceless
===============================
`;
};

// Local implementation of generateMusicTasteAnalysis
const generateMusicTasteAnalysis = async (formattedData) => {
  try {
    console.log("Generating music taste analysis with local function...");
    
    // Create a descriptive prompt for analysis
    const prompt = `Analyze this Spotify listening data and provide insights about the user's music taste. 
    Be creative, thoughtful and personalized in your analysis. Structure your response like a receipt with
    sections for main genres, mood tendencies, listening patterns, and any interesting observations.
    
    Top Tracks:
    ${JSON.stringify(formattedData.tracks.slice(0, 20), null, 2)}
    
    Top Artists:
    ${JSON.stringify(formattedData.artists.slice(0, 10), null, 2)}
    
    Provide your analysis in the following format:
    1. Music Personality: A one-line description of their overall music personality
    2. Main Genres: List the top genres they listen to with percentages
    3. Mood Analysis: Describe the emotional tendency of their music
    4. Hidden Gems: Mention any less-popular artists or tracks that stand out
    5. Music Receipt: Format the insights like a store receipt with total "emotional value"
    `;
    
    // Access environment variables
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // Free model with good performance
    
    if (!HUGGINGFACE_API_KEY) {
      console.warn("No Hugging Face API key found, generating mock response");
      return generateMockAnalysis(formattedData);
    }
    
    // Query Hugging Face
    const response = await axios({
      url: `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        inputs: `<s>[INST] ${prompt} [/INST]</s>`,
        parameters: {
          max_new_tokens: 1000,
          return_full_text: false,
          temperature: 0.7,
        }
      },
    });
    
    return response.data[0].generated_text;
    
  } catch (error) {
    console.error('Error generating music taste analysis:', error);
    return generateMockAnalysis(formattedData);
  }
};

// Local implementation of generateMoodPlaylistRecommendations
const generateMoodPlaylistRecommendations = async (formattedData, mood) => {
  try {
    console.log("Generating mood playlist recommendations with local function...");
    
    // Create a descriptive prompt for playlist generation
    const prompt = `Based on this user's listening history and their desired mood/vibe of "${mood}", 
    recommend tracks for a personalized playlist. The recommendations should match both their music taste
    and the requested mood.
    
    Top Tracks:
    ${JSON.stringify(formattedData.tracks.slice(0, 20), null, 2)}
    
    Top Artists:
    ${JSON.stringify(formattedData.artists.slice(0, 10), null, 2)}
    
    For the mood "${mood}", provide:
    1. A creative name for the playlist
    2. A short description of the playlist's vibe
    3. A list of 10-15 specific track recommendations (either from their top tracks or similar tracks)
      - Include artist name and track title for each
      - Briefly explain why each track fits the mood
    `;
    
    // Access environment variables
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // Free model with good performance
    
    if (!HUGGINGFACE_API_KEY) {
      // Fallback if no API key
      return `
# ${mood.charAt(0).toUpperCase() + mood.slice(1)} Playlist

## Playlist Name: "${mood.toUpperCase()} Vibes"

## Description:
A personalized playlist crafted to match your ${mood} mood, based on your listening history.

## Track Recommendations:
1. "${formattedData.tracks[0]?.name}" by ${formattedData.tracks[0]?.artist}
2. "${formattedData.tracks[2]?.name}" by ${formattedData.tracks[2]?.artist}
3. "${formattedData.tracks[5]?.name}" by ${formattedData.tracks[5]?.artist}
4. "${formattedData.tracks[7]?.name}" by ${formattedData.tracks[7]?.artist}
5. "${formattedData.tracks[10]?.name}" by ${formattedData.tracks[10]?.artist}
`;
    }
    
    // Query Hugging Face
    const response = await axios({
      url: `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        inputs: `<s>[INST] ${prompt} [/INST]</s>`,
        parameters: {
          max_new_tokens: 1000,
          return_full_text: false,
          temperature: 0.7,
        }
      },
    });
    
    return response.data[0].generated_text;
    
  } catch (error) {
    console.error('Error generating mood playlist recommendations:', error);
    // Return a simple fallback
    return `
# ${mood.charAt(0).toUpperCase() + mood.slice(1)} Playlist

## Playlist Name: "${mood.toUpperCase()} Vibes"

## Description:
A personalized playlist crafted to match your ${mood} mood, based on your listening history.

## Track Recommendations:
1. "${formattedData.tracks[0]?.name}" by ${formattedData.tracks[0]?.artist}
2. "${formattedData.tracks[2]?.name}" by ${formattedData.tracks[2]?.artist}
3. "${formattedData.tracks[5]?.name}" by ${formattedData.tracks[5]?.artist}
4. "${formattedData.tracks[7]?.name}" by ${formattedData.tracks[7]?.artist}
5. "${formattedData.tracks[10]?.name}" by ${formattedData.tracks[10]?.artist}
`;
  }
};

// Generate music taste analysis
exports.analyzeMusicTaste = async (req, res) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }
  
  spotifyApi.setAccessToken(access_token);
  
  console.log("Analyzing music taste with token:", access_token.substring(0, 10) + '...');
  
  try {
    // Test API call to check permissions
    console.log("Testing user profile access...");
    const meResponse = await spotifyApi.getMe();
    console.log("Profile access successful for:", meResponse.body.display_name);
    
    // Now try to access top tracks with detailed logging
    console.log("Attempting to access top tracks...");
    const topTracksResponse = await spotifyApi.getMyTopTracks({ 
      limit: 50, 
      time_range: 'medium_term' 
    });
    
    console.log("Successfully retrieved top tracks:", topTracksResponse.body.items.length);
    
    // Get top artists
    console.log("Fetching top artists...");
    const topArtistsResponse = await spotifyApi.getMyTopArtists({ 
      limit: 20, 
      time_range: 'medium_term' 
    });
    
    console.log("Successfully retrieved top artists:", topArtistsResponse.body.items.length);
    
    // Format the data
    const topTracks = topTracksResponse.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      popularity: track.popularity
    }));
    
    const topArtists = topArtistsResponse.body.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity
    }));
    
    // Define trackIds from top tracks
    const trackIds = topTracks.map(track => track.id);
    
    // Get audio features for top tracks
    console.log("Fetching audio features...");
    let audioFeatures = [];

    try {
      // Process in smaller batches of 20 tracks at a time
      const batchSize = 20;
      
      for (let i = 0; i < trackIds.length; i += batchSize) {
        const batchIds = trackIds.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of audio features (${batchIds.length} tracks)...`);
        
        const batchResponse = await spotifyApi.getAudioFeaturesForTracks(batchIds);
        if (batchResponse.body && batchResponse.body.audio_features) {
          audioFeatures = [...audioFeatures, ...batchResponse.body.audio_features];
        }
        
        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < trackIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`Successfully retrieved audio features for ${audioFeatures.length} tracks`);
    } catch (audioError) {
      // If audio features fail, log but continue without them
      console.error("Error fetching audio features:", audioError);
      console.log("Continuing analysis without audio features");
    }

    // Fallback to empty array if audioFeatures is still undefined
    audioFeatures = audioFeatures || [];

    // Format data for LLM using our local function
    console.log("Formatting data for analysis...");
    const formattedData = formatSpotifyData({
      topTracks,
      topArtists,
      audioFeatures
    });
    
    // Generate analysis
    console.log("Sending data to LLM for analysis...");
    const analysis = await generateMusicTasteAnalysis(formattedData);
    
    console.log("Analysis complete. Returning results.");
    res.json({ analysis });
    
  } catch (error) {
    console.error('Error analyzing music taste:', error);
    
    // Enhanced error response with more details
    if (error.statusCode === 403) {
      return res.status(403).json({ 
        error: 'Permission denied by Spotify API', 
        details: 'This likely means the required "user-top-read" permission was not granted.',
        message: error.body?.error?.message || 'No details provided',
        solution: 'Please log out and log in again, making sure to accept ALL permissions requested.'
      });
    }
    
    if (error.statusCode === 401) {
      return res.status(401).json({
        error: 'Authentication failed',
        details: 'Your Spotify session has expired',
        solution: 'Please log in again'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze music taste',
      message: error.message || 'Unknown error'
    });
  }
};

// Generate mood-based playlist recommendations
exports.generateMoodPlaylist = async (req, res) => {
  const { access_token, mood } = req.body;
  
  if (!access_token || !mood) {
    return res.status(400).json({ error: 'Access token and mood are required' });
  }
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    // Fetch user's top tracks, artists, and audio features
    const [topTracksResponse, topArtistsResponse] = await Promise.all([
      spotifyApi.getMyTopTracks({ limit: 50, time_range: 'medium_term' }),
      spotifyApi.getMyTopArtists({ limit: 20, time_range: 'medium_term' })
    ]);
    
    const topTracks = topTracksResponse.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      popularity: track.popularity,
      uri: track.uri
    }));
    
    const topArtists = topArtistsResponse.body.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity
    }));
    
    // Get audio features for top tracks (with error handling)
    let audioFeatures = [];
    try {
      const trackIds = topTracks.map(track => track.id);
      const audioFeaturesResponse = await spotifyApi.getAudioFeaturesForTracks(trackIds);
      audioFeatures = audioFeaturesResponse.body.audio_features || [];
    } catch (audioError) {
      console.error("Error fetching audio features for playlist:", audioError);
      console.log("Continuing playlist generation without audio features");
    }
    
    // Format data for LLM using our local function
    const formattedData = formatSpotifyData({
      topTracks,
      topArtists,
      audioFeatures
    });
    
    // Generate playlist recommendations
    const recommendations = await generateMoodPlaylistRecommendations(formattedData, mood);
    
    res.json({ 
      recommendations,
      available_tracks: topTracks // Include top tracks so frontend can create the playlist
    });
    
  } catch (error) {
    console.error('Error generating mood playlist:', error);
    
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: `Spotify API error (${error.statusCode})`,
        details: error.body?.error?.message || 'Unknown error',
        solution: 'Please try again or log in again if the problem persists'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate mood playlist',
      message: error.message || 'Unknown error'
    });
  }
};

// Search for tracks to add to playlist (from LLM suggestions)
exports.searchTracks = async (req, res) => {
  const { access_token, query } = req.query;
  
  if (!access_token || !query) {
    return res.status(400).json({ error: 'Access token and query are required' });
  }
  
  spotifyApi.setAccessToken(access_token);
  
  try {
    const searchResponse = await spotifyApi.searchTracks(query, { limit: 5 });
    const tracks = searchResponse.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      uri: track.uri,
      image: track.album.images[0]?.url
    }));
    
    res.json({ tracks });
    
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
};

module.exports = exports;
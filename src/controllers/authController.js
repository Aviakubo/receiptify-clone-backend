// backend/src/controllers/authController.js
const spotifyApi = require('../utils/spotifyClient');

// Generate login URL
exports.getLoginUrl = (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',          // CRUCIAL for analyzing music taste
    'user-read-recently-played',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read'       // Add this if you want to access saved tracks
  ];
  
  // Generate a random string for state
  const state = Math.random().toString(36).substring(2, 15);
  
  // Explicitly include redirect URI to ensure it matches what's registered
  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/callback';
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, true);
  res.json({ url: authorizeURL });
};

// Handle callback after Spotify auth
exports.handleCallback = async (req, res) => {
  const { code } = req.query;

  console.log("Processing auth code:", code.substring(0, 10) +'...');

  console.log("Auth code received:", code);
  console.log("Redirect URI being used:", process.env.REDIRECT_URI);
  console.log("Client ID being used:", process.env.SPOTIFY_CLIENT_ID);

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required'});
  }
  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    res.json({
      access_token,
      refresh_token,
      expires_in
    });
  
} catch (error) {
  console.error('Error getting tokens:', error);
  res.status(400).json({ error: 'Failed to exchange code for tokens' });
}
};

// Refresh the access token
exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  
  spotifyApi.setRefreshToken(refresh_token);
  
  try {
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;
    
    res.json({
      access_token,
      expires_in
    });
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
};

exports.validateToken = async (req, res) => {
  const { access_token } = req.query;

  if(!access_token) {
    return res.json({ valid: false });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    await spotifyApi.getMe();
    res.json({ valid: true });
  } catch (error) {
    console.log('Token validation failed:', error);
    res.json({ valid: false });
  }
};
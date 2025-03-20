// backend/src/routes/userDataRoutes.js
const express = require('express');
const router = express.Router();
const userDataController = require('../controllers/userDataController');

router.get('/top-tracks', userDataController.getTopTracks);
router.get('/top-artists', userDataController.getTopArtists);
router.get('/recently-played', userDataController.getRecentlyPlayed);
router.get('/audio-features', userDataController.getTracksAudioFeatures);
router.post('/profile', userDataController.getUserProfile);

module.exports = router;
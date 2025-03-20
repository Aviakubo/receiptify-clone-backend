// backend/src/routes/llmRoutes.js
const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llmController');

router.post('/analyze-taste', llmController.analyzeMusicTaste);
router.post('/generate-mood-playlist', llmController.generateMoodPlaylist);
router.get('/search-tracks', llmController.searchTracks);

module.exports = router;
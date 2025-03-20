// backend/src/routes/playlistRoutes.js
const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');

router.post('/create', playlistController.createPlaylist);
router.post('/add-tracks', playlistController.addTracksToPlaylist);

module.exports = router;
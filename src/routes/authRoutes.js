// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.getLoginUrl);
router.get('/callback', authController.handleCallback);
router.post('/refresh', authController.refreshToken);
router.get('/validate-token', authController.validateToken);

module.exports = router;
// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const userDataRoutes = require('./routes/userDataRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const llmRoutes = require('./routes/llmRoutes'); // We'll create this next

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add this near your other middleware, before your routes
app.use((req, res, next) => {
  // Store used auth codes to prevent duplicate processing
  if (!app.locals.usedAuthCodes) {
    app.locals.usedAuthCodes = new Set();
  }
  
  if (req.path === '/api/auth/callback' && req.query.code) {
    const code = req.query.code;
    if (app.locals.usedAuthCodes.has(code)) {
      console.log('Preventing duplicate auth code usage:', code.substring(0, 10) + '...');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=code_already_used`);
    }
    app.locals.usedAuthCodes.add(code);
  }
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user-data', userDataRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/llm', llmRoutes);

app.get('/', (req, res) => {
  res.send('Spotify Analyzer API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
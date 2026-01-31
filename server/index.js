const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Helper to adapt your existing Netlify-style functions to Express
const adapt = (fn) => async (req, res) => {
  const event = {
    httpMethod: req.method,
    body: JSON.stringify(req.body), // Handlers expect stringified body
    queryStringParameters: req.query,
    headers: req.headers
  };
  
  // Mock context
  const context = {};

  try {
    const result = await fn.handler(event, context);
    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// API Routes - Connects URLs to your existing api files
app.all('/api/config', adapt(require('../api/config')));
app.all('/api/leaderboard', adapt(require('../api/leaderboard')));

// Admin Routes
app.all('/api/admin/login', adapt(require('../api/admin/login')));
app.all('/api/admin/update', adapt(require('../api/admin/update')));
app.all('/api/admin/links', adapt(require('../api/admin/links')));
app.all('/api/admin/leaderboard', adapt(require('../api/admin/leaderboard')));
app.all('/api/admin/reset', adapt(require('../api/admin/reset')));

// Compatibility routes for older frontend versions
app.all('/api/admin-login', adapt(require('../api/admin/login')));
app.all('/api/admin-update', adapt(require('../api/admin/update')));
app.all('/api/admin-links', adapt(require('../api/admin/links')));
app.all('/api/admin-leaderboard', adapt(require('../api/admin/leaderboard')));
app.all('/api/admin-reset', adapt(require('../api/admin/reset')));

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const axios = require('axios');
require('dotenv').config();

// --- MIDDLEWARE ---
// 1. Enable CORS for all routes (must be first)
app.use(cors({
  origin: 'http://localhost:3000', // Allow only the frontend to access
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// 2. Enable JSON body parsing
app.use(express.json());


// --- ROUTES ---
// Your routes (e.g., app.use('/api/users', usersRouter)) should go here...

// Proxy route for /api/places
app.get('/api/places', async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
      params: {
        location: `${lat},${lng}`,
        radius: 1500,
        key: process.env.GOOGLE_PLACES_API_KEY, // Use env variable
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching places:', error.message);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});


// --- SERVER START ---
// Your app.listen(...) should go here...


module.exports = app; // if you export for testing, otherwise remove 
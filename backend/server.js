// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== KONFIGURASI CORS =====
const allowedOrigins = [
  'https://whimsical-daffodil-49567c.netlify.app', // Ganti dengan URL Netlify Anda
  'http://localhost:5173', // Untuk development lokal
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (seperti dari Postman atau curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Jika Anda lebih suka mengizinkan semua origin (hanya untuk testing):
// app.use(cors());

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/upload', require('./routes/upload'));

app.get('/', (req, res) => {
  res.send('Barter API is running');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'ADA ✅' : 'TIDAK ADA ❌');
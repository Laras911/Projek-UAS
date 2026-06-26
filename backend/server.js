require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from uploads
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
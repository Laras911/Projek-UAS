// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan (JPEG, PNG, GIF, WebP)'), false);
    }
  }
});

// Endpoint upload
router.post('/', auth, (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
          return res.status(400).json({ message: 'Ukuran file terlalu besar (maks 5MB)' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    // KEMBALIKAN URL ABSOLUT
    const BASE_URL = process.env.BASE_URL || 'https://barter-backend-eku2.onrender.com';
    const fileUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    res.json({ imageUrl: fileUrl });
  });
});

module.exports = router;
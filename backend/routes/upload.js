const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
  }
});

// Upload gambar
router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang diupload' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl: fileUrl });
});

// Error handler untuk multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'Ukuran file terlalu besar (maks 5MB)' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
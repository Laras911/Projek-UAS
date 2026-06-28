// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth.js');

const router = express.Router();

// Konfigurasi Cloudinary dari environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer dengan memory storage (tidak simpan ke disk)
const storage = multer.memoryStorage();
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

// Endpoint upload ke Cloudinary
router.post('/', auth, (req, res) => {
  upload.single('image')(req, res, async function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
          return res.status(400).json({ message: 'Ukuran file terlalu besar (maks 5MB)' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    try {
      // Upload buffer ke Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'barter-yuk', // folder di Cloudinary
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Kirim URL publik ke frontend
      res.json({ imageUrl: result.secure_url });
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      res.status(500).json({ message: 'Gagal upload gambar ke Cloudinary' });
    }
  });
});

module.exports = router;
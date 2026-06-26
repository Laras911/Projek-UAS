const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database.js');
const auth = require('../middleware/auth.js');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia';

// ===== REGISTER =====
router.post('/register', async (req, res) => {
  const { username, email, password, fullname, phone, address } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, dan password wajib' });
  }

  db.get('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email], async (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (row) return res.status(400).json({ message: 'Username atau email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, email, password, fullname, phone, address) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, email, hashed, fullname || '', phone || '', address || ''],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: 'Registrasi berhasil', userId: this.lastID });
      }
    );
  });
});

// ===== LOGIN (menggunakan email) =====
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib' });
  }

  db.get('SELECT * FROM users WHERE email = $1', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!user) return res.status(401).json({ message: 'Email atau password salah' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Email atau password salah' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar || null
      }
    });
  });
});

// ===== GET PROFILE =====
router.get('/profile', auth, (req, res) => {
  const userId = req.userId;
  db.get(
    'SELECT id, username, email, fullname, phone, address, avatar FROM users WHERE id = $1',
    [userId],
    (err, user) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
      res.json({ user });
    }
  );
});

// ===== UPDATE PROFILE =====
router.put('/profile', auth, (req, res) => {
  const { username, fullname, phone, address, avatar } = req.body;
  const userId = req.userId;

  if (!fullname) return res.status(400).json({ message: 'Nama lengkap wajib diisi' });
  if (!username) return res.status(400).json({ message: 'Username wajib diisi' });

  db.get('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (row) return res.status(400).json({ message: 'Username sudah digunakan oleh user lain' });

    db.run(
      'UPDATE users SET username = $1, fullname = $2, phone = $3, address = $4, avatar = $5 WHERE id = $6',
      [username, fullname, phone || '', address || '', avatar || null, userId],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });

        db.get(
          'SELECT id, username, email, fullname, phone, address, avatar FROM users WHERE id = $1',
          [userId],
          (err, user) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

            res.json({
              message: 'Profil berhasil diperbarui',
              user
            });
          }
        );
      }
    );
  });
});

module.exports = router;
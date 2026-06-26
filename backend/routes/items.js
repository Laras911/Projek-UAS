const express = require('express');
const db = require('../database.js');
const auth = require('../middleware/auth.js');

const router = express.Router();
router.use(auth);

// GET semua item milik sendiri
router.get('/my', (req, res) => {
  db.all('SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// GET count item available
router.get('/count', (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM items WHERE user_id = $1 AND status = $2',
    [req.userId, 'available'],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ count: row?.count || 0 });
    }
  );
});

// GET semua item orang lain (available)
router.get('/others', (req, res) => {
  db.all(
    `SELECT i.*, u.username as owner_name, u.avatar as owner_avatar
     FROM items i
     JOIN users u ON i.user_id = u.id
     WHERE i.user_id != $1 AND i.status = $2
     ORDER BY i.created_at DESC`,
    [req.userId, 'available'],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});

// GET item by id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM items WHERE id = $1', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Item tidak ditemukan' });
    res.json(row);
  });
});

// POST tambah item
router.post('/', (req, res) => {
  const { name, category, description, condition, image_url } = req.body;
  if (!name) return res.status(400).json({ message: 'Nama barang wajib' });

  db.run(
    'INSERT INTO items (user_id, name, category, description, condition, image_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [req.userId, name, category || '', description || '', condition || '', image_url || '', 'available'],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      
      // Auto-delete max 9 (hanya untuk available)
      db.get('SELECT COUNT(*) as count FROM items WHERE user_id = $1 AND status = $2', [req.userId, 'available'], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        const count = row?.count || 0;
        if (count > 9) {
          const excess = count - 9;
          db.all(
            'SELECT id FROM items WHERE user_id = $1 AND status = $2 ORDER BY created_at ASC LIMIT $3',
            [req.userId, 'available', excess],
            (err, rows) => {
              if (err) return res.status(500).json({ message: err.message });
              const ids = rows.map(r => r.id);
              if (ids.length > 0) {
                const placeholders = ids.map((_, i) => `$${i+1}`).join(',');
                db.run(`DELETE FROM items WHERE id IN (${placeholders})`, ids, (err) => {
                  if (err) return res.status(500).json({ message: err.message });
                  res.status(201).json({ id: this.lastID, message: 'Barang berhasil ditambahkan (item tertua dihapus)' });
                });
              } else {
                res.status(201).json({ id: this.lastID, message: 'Barang berhasil ditambahkan' });
              }
            }
          );
        } else {
          res.status(201).json({ id: this.lastID, message: 'Barang berhasil ditambahkan' });
        }
      });
    }
  );
});

// PUT update item
router.put('/:id', (req, res) => {
  const { name, category, description, condition, image_url, status } = req.body;
  db.get('SELECT * FROM items WHERE id = $1 AND user_id = $2', [req.params.id, req.userId], (err, item) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!item) return res.status(403).json({ message: 'Anda tidak memiliki akses ke item ini' });

    db.run(
      `UPDATE items 
       SET name = $1, category = $2, description = $3, condition = $4, image_url = $5, status = $6 
       WHERE id = $7`,
      [name || item.name, category || item.category, description || item.description,
       condition || item.condition, image_url || item.image_url, status || item.status, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Item berhasil diperbarui' });
      }
    );
  });
});

// DELETE item (HARD DELETE)
router.delete('/:id', (req, res) => {
  db.get('SELECT * FROM items WHERE id = $1 AND user_id = $2', [req.params.id, req.userId], (err, item) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!item) return res.status(403).json({ message: 'Anda tidak memiliki akses' });

    db.run('DELETE FROM items WHERE id = $1', [req.params.id], function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Item berhasil dihapus permanen' });
    });
  });
});

// RESET semua item
router.delete('/reset', auth, (req, res) => {
  db.run('DELETE FROM items WHERE user_id = $1', [req.userId], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({
      message: `Berhasil menghapus ${this.changes} barang secara permanen`,
      deletedCount: this.changes
    });
  });
});

module.exports = router;
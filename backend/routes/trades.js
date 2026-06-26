// backend/routes/trades.js
const express = require('express');
const db = require('../database.js');
const auth = require('../middleware/auth.js');

const router = express.Router();
router.use(auth);

// ===== FUNGSI CLEANUP (max 5 masing-masing) =====
const cleanupTrades = (userId, callback) => {
  // Incoming: requested_by = userId, status = 'pending'
  db.all(
    'SELECT id FROM trades WHERE requested_by = $1 AND status = $2 ORDER BY created_at ASC',
    [userId, 'pending'],
    (err, rows) => {
      if (err) return callback(err);
      const incomingIds = rows.map(r => r.id);
      if (incomingIds.length > 5) {
        const excess = incomingIds.length - 5;
        const idsToDelete = incomingIds.slice(0, excess);
        const placeholders = idsToDelete.map((_, i) => `$${i+1}`).join(',');
        db.run(`DELETE FROM trades WHERE id IN (${placeholders})`, idsToDelete, (err) => {
          if (err) return callback(err);
        });
      }

      // Outgoing: offered_by = userId, status = 'pending'
      db.all(
        'SELECT id FROM trades WHERE offered_by = $1 AND status = $2 ORDER BY created_at ASC',
        [userId, 'pending'],
        (err, rows) => {
          if (err) return callback(err);
          const outgoingIds = rows.map(r => r.id);
          if (outgoingIds.length > 5) {
            const excess = outgoingIds.length - 5;
            const idsToDelete = outgoingIds.slice(0, excess);
            const placeholders = idsToDelete.map((_, i) => `$${i+1}`).join(',');
            db.run(`DELETE FROM trades WHERE id IN (${placeholders})`, idsToDelete, (err) => {
              if (err) return callback(err);
              callback(null);
            });
          } else {
            callback(null);
          }
        }
      );
    }
  );
};

// ========================================
// BUAT PERMINTAAN BARTER
// ========================================
router.post('/', (req, res) => {
  const { item_offered_id, item_requested_id, message } = req.body;
  if (!item_offered_id || !item_requested_id) {
    return res.status(400).json({ message: 'Item penawaran dan item yang diminta wajib' });
  }

  db.get(
    'SELECT * FROM items WHERE id = $1 AND user_id = $2',
    [item_offered_id, req.userId],
    (err, offered) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!offered) return res.status(403).json({ message: 'Anda tidak memiliki item yang ditawarkan' });

      db.get(
        'SELECT * FROM items WHERE id = $1',
        [item_requested_id],
        (err, requested) => {
          if (err) return res.status(500).json({ message: err.message });
          if (!requested) return res.status(404).json({ message: 'Item yang diminta tidak ditemukan' });
          if (requested.user_id === req.userId) {
            return res.status(400).json({ message: 'Anda tidak bisa meminta barang sendiri' });
          }
          if (requested.status !== 'available') {
            return res.status(400).json({ message: 'Item tidak tersedia' });
          }

          db.run(
            `INSERT INTO trades 
             (item_offered_id, item_requested_id, offered_by, requested_by, message, status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [item_offered_id, item_requested_id, req.userId, requested.user_id, message || '', 'pending'],
            function (err) {
              if (err) return res.status(500).json({ message: err.message });

              cleanupTrades(req.userId, (err) => {
                if (err) console.error('Cleanup error:', err);
                res.status(201).json({ 
                  id: this.lastID, 
                  message: 'Permintaan barter dikirim' 
                });
              });
            }
          );
        }
      );
    }
  );
});

// ========================================
// GET PERMINTAAN MASUK
// ========================================
router.get('/incoming', (req, res) => {
  cleanupTrades(req.userId, (err) => {
    if (err) console.error('Cleanup error:', err);

    db.all(
      `SELECT t.*,
              u1.username as offered_by_username,
              u1.avatar as offered_by_avatar,
              u2.username as requested_by_username,
              u2.avatar as requested_by_avatar,
              i1.name as offered_item_name,
              i1.image_url as offered_item_image,
              i1.description as offered_item_desc,
              i2.name as requested_item_name,
              i2.image_url as requested_item_image,
              i2.description as requested_item_desc
       FROM trades t
       JOIN users u1 ON t.offered_by = u1.id
       JOIN users u2 ON t.requested_by = u2.id
       JOIN items i1 ON t.item_offered_id = i1.id
       JOIN items i2 ON t.item_requested_id = i2.id
       WHERE t.requested_by = $1
       ORDER BY t.created_at DESC`,
      [req.userId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
      }
    );
  });
});

// ========================================
// GET PERMINTAAN KELUAR
// ========================================
router.get('/outgoing', (req, res) => {
  cleanupTrades(req.userId, (err) => {
    if (err) console.error('Cleanup error:', err);

    db.all(
      `SELECT t.*,
              u1.username as offered_by_username,
              u1.avatar as offered_by_avatar,
              u2.username as requested_by_username,
              u2.avatar as requested_by_avatar,
              i1.name as offered_item_name,
              i1.image_url as offered_item_image,
              i1.description as offered_item_desc,
              i2.name as requested_item_name,
              i2.image_url as requested_item_image,
              i2.description as requested_item_desc
       FROM trades t
       JOIN users u1 ON t.offered_by = u1.id
       JOIN users u2 ON t.requested_by = u2.id
       JOIN items i1 ON t.item_offered_id = i1.id
       JOIN items i2 ON t.item_requested_id = i2.id
       WHERE t.offered_by = $1
       ORDER BY t.created_at DESC`,
      [req.userId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
      }
    );
  });
});

// ========================================
// UPDATE STATUS PERMINTAAN
// ========================================
router.put('/:id', (req, res) => {
  const { status, reason } = req.body;
  if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  db.get('SELECT * FROM trades WHERE id = $1', [req.params.id], (err, trade) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!trade) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

    if (status === 'accepted' || status === 'rejected') {
      if (trade.requested_by !== req.userId) {
        return res.status(403).json({ message: 'Anda tidak berhak mengubah status ini' });
      }
    } else if (status === 'cancelled') {
      if (trade.offered_by !== req.userId) {
        return res.status(403).json({ message: 'Anda tidak berhak membatalkan permintaan ini' });
      }
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ message: 'Status sudah diproses' });
    }

    const updateQuery = reason
      ? 'UPDATE trades SET status = $1, reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3'
      : 'UPDATE trades SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    const params = reason ? [status, reason, req.params.id] : [status, req.params.id];

    db.run(updateQuery, params, function (err) {
      if (err) return res.status(500).json({ message: err.message });

      if (status === 'accepted') {
        db.run('UPDATE items SET status = $1 WHERE id = $2', ['traded', trade.item_offered_id]);
        db.run('UPDATE items SET status = $1 WHERE id = $2', ['traded', trade.item_requested_id]);
      }

      res.json({ message: `Permintaan ${status}` });
    });
  });
});

// ========================================
// GET KONTAK PIHAK LAIN (dengan alamat)
// ========================================
router.get('/:id/contact', auth, (req, res) => {
  const tradeId = req.params.id;
  const userId = req.userId;

  db.get(
    `SELECT t.*,
            u1.id as offered_by_id, u1.username as offered_by_username,
            u1.phone as offered_by_phone, u1.email as offered_by_email,
            u1.address as offered_by_address,
            u2.id as requested_by_id, u2.username as requested_by_username,
            u2.phone as requested_by_phone, u2.email as requested_by_email,
            u2.address as requested_by_address
     FROM trades t
     JOIN users u1 ON t.offered_by = u1.id
     JOIN users u2 ON t.requested_by = u2.id
     WHERE t.id = $1 AND (t.offered_by = $2 OR t.requested_by = $2)`,
    [tradeId, userId],
    (err, trade) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!trade) return res.status(404).json({ message: 'Transaksi tidak ditemukan atau Anda tidak terlibat' });

      if (trade.status !== 'accepted') {
        return res.status(403).json({ message: 'Kontak hanya tersedia setelah transaksi diterima' });
      }

      let otherUser = null;
      if (trade.offered_by_id === userId) {
        otherUser = {
          id: trade.requested_by_id,
          username: trade.requested_by_username,
          phone: trade.requested_by_phone,
          email: trade.requested_by_email,
          address: trade.requested_by_address
        };
      } else if (trade.requested_by_id === userId) {
        otherUser = {
          id: trade.offered_by_id,
          username: trade.offered_by_username,
          phone: trade.offered_by_phone,
          email: trade.offered_by_email,
          address: trade.offered_by_address
        };
      }

      res.json({ contact: otherUser });
    }
  );
});

module.exports = router;
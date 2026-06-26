// backend/database.js
const { Pool } = require('pg');

let db;

if (process.env.DATABASE_URL) {
  // ===== PRODUCTION: PostgreSQL =====
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  db = {
    get: (sql, params, callback) => {
      pool.query(sql, params)
        .then(res => callback(null, res.rows[0] || null))
        .catch(err => callback(err, null));
    },
    all: (sql, params, callback) => {
      pool.query(sql, params)
        .then(res => callback(null, res.rows))
        .catch(err => callback(err, null));
    },
    run: (sql, params, callback) => {
      pool.query(sql, params)
        .then(res => {
          const result = { lastID: res.rows?.[0]?.id || null, changes: res.rowCount || 0 };
          callback.call(result, null);
        })
        .catch(err => callback(err, null));
    },
    serialize: (fn) => { if (fn) fn(); },
    close: () => pool.end()
  };

  console.log('✅ Terhubung ke PostgreSQL (production)');
} else {
  console.error('❌ DATABASE_URL tidak ditemukan!');
  console.error('   Pastikan environment variable DATABASE_URL sudah diatur.');
  process.exit(1);
}

module.exports = db;
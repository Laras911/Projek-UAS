// backend/database.js
const { Pool } = require('pg');
const path = require('path');

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
  // ===== DEVELOPMENT: SQLite =====
  let sqlite3;
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (e) {
    console.error('❌ sqlite3 tidak ditemukan. Install dengan npm install sqlite3 untuk development.');
    process.exit(1);
  }

  const sqliteDb = new sqlite3.Database(path.join(__dirname, 'barter.db'));

  db = {
    get: sqliteDb.get.bind(sqliteDb),
    all: sqliteDb.all.bind(sqliteDb),
    run: sqliteDb.run.bind(sqliteDb),
    serialize: sqliteDb.serialize.bind(sqliteDb),
    close: sqliteDb.close.bind(sqliteDb)
  };

  // Buat tabel untuk development (jika perlu)
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullname TEXT,
        phone TEXT,
        address TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // tambahkan items dan trades jika diperlukan
  });

  console.log('✅ Terhubung ke SQLite (development)');
}

module.exports = db;
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
          const result = {
            lastID: res.rows?.[0]?.id || null,
            changes: res.rowCount || 0
          };
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
  // Hanya untuk local development, pastikan sqlite3 terinstall di devDependencies
  try {
    const sqlite3 = require('sqlite3').verbose();
    const sqliteDb = new sqlite3.Database(path.join(__dirname, 'barter.db'));

    db = {
      get: sqliteDb.get.bind(sqliteDb),
      all: sqliteDb.all.bind(sqliteDb),
      run: sqliteDb.run.bind(sqliteDb),
      serialize: sqliteDb.serialize.bind(sqliteDb),
      close: sqliteDb.close.bind(sqliteDb)
    };

    // Buat tabel jika belum ada (untuk development)
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
      db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          category TEXT,
          description TEXT,
          condition TEXT,
          image_url TEXT,
          status TEXT DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS trades (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_offered_id INTEGER NOT NULL,
          item_requested_id INTEGER NOT NULL,
          offered_by INTEGER NOT NULL,
          requested_by INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          message TEXT,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_offered_id) REFERENCES items(id),
          FOREIGN KEY (item_requested_id) REFERENCES items(id),
          FOREIGN KEY (offered_by) REFERENCES users(id),
          FOREIGN KEY (requested_by) REFERENCES users(id)
        )
      `);
      console.log('✅ Tabel SQLite siap (development)');
    });

    console.log('✅ Terhubung ke SQLite (development)');
  } catch (err) {
    console.error('❌ SQLite tidak ditemukan. Pastikan sqlite3 terinstall untuk development.');
    console.error('   Atau set DATABASE_URL untuk menggunakan PostgreSQL.');
    throw err;
  }
}

module.exports = db;
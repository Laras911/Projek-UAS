// backend/migrate.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullname TEXT,
        phone TEXT,
        address TEXT,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        condition TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        item_offered_id INTEGER NOT NULL REFERENCES items(id),
        item_requested_id INTEGER NOT NULL REFERENCES items(id),
        offered_by INTEGER NOT NULL REFERENCES users(id),
        requested_by INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        message TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabel PostgreSQL berhasil dibuat');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal membuat tabel:', err);
    process.exit(1);
  }
};

createTables();
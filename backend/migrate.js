// backend/migrate.js
require('dotenv').config(); // 🔥 WAJIB: Load .env file

const { Pool } = require('pg');

// Cek apakah DATABASE_URL ada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL tidak ditemukan di .env!');
  console.error('   Pastikan file .env ada dan berisi DATABASE_URL');
  process.exit(1);
}

console.log('🔗 Mencoba koneksi ke Supabase...');

// Gunakan pooled connection (port 6543) untuk menghindari ECONNREFUSED
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib untuk Supabase
  },
  // Tambahkan timeout agar tidak hang
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

const createTables = async () => {
  try {
    console.log('📦 Membuat tabel di Supabase...');

    // ===== USERS =====
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
    console.log('✅ Tabel users siap');

    // ===== ITEMS =====
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        condition TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabel items siap');

    // ===== TRADES =====
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        item_offered_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        item_requested_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        offered_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        message TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabel trades siap');

    console.log('🎉 Semua tabel berhasil dibuat di Supabase!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal membuat tabel:', err.message || err);
    
    // Tampilkan detail error
    if (err.code === 'ECONNREFUSED') {
      console.error('⚠️ Koneksi ditolak. Periksa:');
      console.error('   1. URL di .env: pastikan tidak ada typo');
      console.error('   2. Coba gunakan pooled URL (port 6543):');
      console.error('      postgresql://postgres:password@aws-0-ap-southeast-2.pooler.supabase.co:6543/postgres');
      console.error('   3. Apakah password database benar?');
      console.error('   4. Coba ping dari browser: https://db.krhlumjrhrodnwqbrzvzw.supabase.co');
    }
    process.exit(1);
  }
};

// Jalankan migrasi
createTables();
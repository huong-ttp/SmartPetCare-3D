const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon yêu cầu SSL
});

pool.on('error', (err) => {
  console.error('Lỗi kết nối PostgreSQL không mong muốn:', err);
});

module.exports = pool;
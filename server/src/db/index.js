const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';
const isCloudPostgres = connectionString && (connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('render.com') || connectionString.includes('sslmode=require'));

const poolConfig = {
  connectionString,
  ssl: isCloudPostgres || isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
};

const pool = new Pool(poolConfig);

let isConnected = false;

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    isConnected = true;
    console.log(`[PostgreSQL] Connected successfully at ${res.rows[0].now}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`[PostgreSQL] Connection warning: Unable to connect to PostgreSQL at ${connectionString ? connectionString.replace(/:[^:@]*@/, ':****@') : 'undefined'}`);
    console.warn(`[PostgreSQL] Error details: ${err.message}`);
    console.warn(`[PostgreSQL] Tip: Paste your Cloud PostgreSQL connection string in server/.env (e.g., Neon or Supabase)`);
    return false;
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
  getIsConnected: () => isConnected
};

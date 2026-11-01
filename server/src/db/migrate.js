const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./index');

async function runMigrations() {
  console.log('[Migration] Starting database migration...');
  const connected = await testConnection();
  if (!connected) {
    console.error('[Migration] Aborted: Cannot connect to PostgreSQL. Please check DATABASE_URL in server/.env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('[Migration] Database tables and indexes created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Error running migration:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

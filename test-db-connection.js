require('dotenv').config();
const mysql = require('mysql2/promise');

async function testTiDBConnection() {
  console.log('🔍 Testing TiDB Cloud connection...');
  
  const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT || 4000,
    user: process.env.TIDB_USERNAME,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
      rejectUnauthorized: false,
      ca: process.env.TIDB_SSL_CA
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to TiDB Cloud database');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);

    // Check database version
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log('📊 Database version:', version[0].version);

    connection.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ TiDB Cloud connection failed:', error.message);
  }
}

testTiDBConnection();
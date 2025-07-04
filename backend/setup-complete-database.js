const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupCompleteDatabase() {
  let connection;
  try {
    console.log('🚀 Starting database setup...');
    
    // Create connection without database selected
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Read and execute the complete SQL file
    const sqlFilePath = path.join(__dirname, 'complete-db-setup.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('📄 Executing database setup script...');
    const results = await connection.query(sqlContent);
    
    console.log('✅ Database setup completed successfully!');
    
    // Verify tables were created
    await connection.query('USE client_management');
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log('📊 Tables created:');
    tables.forEach(table => {
      const tableName = table[`Tables_in_client_management`];
      console.log(`  - ${tableName}`);
    });
    
    // Get count of records in each table
    console.log('\n📈 Sample data inserted:');
    const tableNames = ['users', 'clients', 'projects', 'tasks', 'transactions'];
    
    for (const tableName of tableNames) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  - ${tableName}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`  - ${tableName}: Error counting records`);
      }
    }
    
    console.log('\n🎉 Database is ready for use!');
    console.log('💡 You can now start your application server.');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Please check your database credentials in your .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Please make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗃️  Database connection issue - this is normal for first setup');
    }
    
    console.error('\n🛠️  Troubleshooting tips:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check your .env file has correct DB credentials');
    console.error('3. Ensure your MySQL user has CREATE DATABASE privileges');
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupCompleteDatabase();
}

module.exports = setupCompleteDatabase; 
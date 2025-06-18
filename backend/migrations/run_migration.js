const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  try {
    // Read the migration SQL
    const migrationSQL = await fs.readFile(
      path.join(__dirname, '004_create_transactions_table.sql'),
      'utf8'
    );

    // Create database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'client_management',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Run the migration
    await connection.query(migrationSQL);
    console.log('Migration completed successfully');

    // Close the connection
    await connection.end();
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration(); 
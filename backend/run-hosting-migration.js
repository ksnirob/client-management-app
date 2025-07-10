const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'client_management',
  multipleStatements: true
};

async function runMigration() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('Connecting to database...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '013_add_hosting_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: 013_add_hosting_fields.sql');
    console.log('SQL:', migrationSQL);
    
    // Execute migration
    await new Promise((resolve, reject) => {
      connection.query(migrationSQL, (error, results) => {
        if (error) {
          console.error('Migration failed:', error);
          reject(error);
        } else {
          console.log('Migration completed successfully!');
          console.log('Results:', results);
          resolve(results);
        }
      });
    });
    
    // Test the new fields by describing the table
    console.log('\nVerifying table structure...');
    await new Promise((resolve, reject) => {
      connection.query('DESCRIBE projects', (error, results) => {
        if (error) {
          reject(error);
        } else {
          console.log('Projects table structure:');
          console.table(results);
          resolve(results);
        }
      });
    });
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    connection.end();
    console.log('Database connection closed.');
  }
}

// Run the migration
runMigration().catch(console.error); 
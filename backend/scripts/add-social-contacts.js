const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSocialContactsColumn() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'client_management'
    });

    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'social_contacts'
    `, [process.env.DB_NAME || 'client_management']);

    if (columns.length > 0) {
      console.log('social_contacts column already exists');
      return;
    }

    // Add the column
    await connection.execute(`
      ALTER TABLE clients 
      ADD COLUMN social_contacts JSON AFTER country
    `);

    console.log('Successfully added social_contacts column');

    // Optionally add some sample data for testing
    await connection.execute(`
      UPDATE clients 
      SET social_contacts = JSON_OBJECT(
        'whatsapp', '+1234567890',
        'linkedin', 'company-profile',
        'website', 'www.example.com'
      ) 
      WHERE id = 1 AND social_contacts IS NULL
    `);

    console.log('Added sample social contacts data');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
addSocialContactsColumn(); 
const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'client_management'
    });

    console.log('Connected to database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'client_management' 
      AND TABLE_NAME = 'projects' 
      AND COLUMN_NAME IN ('project_live_url', 'project_files', 'admin_login_url', 'username_email', 'password')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    // Add missing columns
    const columnsToAdd = [
      { name: 'project_live_url', type: 'VARCHAR(500)' },
      { name: 'project_files', type: 'TEXT' },
      { name: 'admin_login_url', type: 'VARCHAR(500)' },
      { name: 'username_email', type: 'VARCHAR(255)' },
      { name: 'password', type: 'VARCHAR(255)' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        await connection.execute(`ALTER TABLE projects ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✓ Added column: ${column.name}`);
      } else {
        console.log(`✓ Column already exists: ${column.name}`);
      }
    }

    console.log('Migration completed successfully');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 
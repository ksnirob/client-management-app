const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'client_management'
    });

    console.log('Connected to database');

    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'client_management' 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'type'
    `);

    if (columns.length === 0) {
      // Add the type column
      await connection.execute(`
        ALTER TABLE tasks
        ADD COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') DEFAULT 'development' AFTER status
      `);

      // Update existing tasks
      await connection.execute(`
        UPDATE tasks SET type = 'development' WHERE type IS NULL
      `);

      console.log('Migration completed successfully - added type column');
    } else {
      console.log('Type column already exists');
    }
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration(); 
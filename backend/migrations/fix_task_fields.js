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

    // First, let's check the current table structure
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'client_management' 
      AND TABLE_NAME = 'tasks'
    `);

    console.log('Current table structure:', columns);

    // Drop and recreate type column
    await connection.execute(`
      ALTER TABLE tasks 
      MODIFY COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') 
      DEFAULT 'development' NOT NULL
    `);

    // Drop and recreate priority column
    await connection.execute(`
      ALTER TABLE tasks 
      MODIFY COLUMN priority ENUM('low', 'medium', 'high') 
      DEFAULT 'medium' NOT NULL
    `);

    // Update any NULL values
    await connection.execute(`
      UPDATE tasks 
      SET type = 'development' 
      WHERE type IS NULL OR type = ''
    `);

    await connection.execute(`
      UPDATE tasks 
      SET priority = 'medium' 
      WHERE priority IS NULL OR priority = ''
    `);

    console.log('Migration completed successfully');

    // Verify the changes
    const [updatedColumns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'client_management' 
      AND TABLE_NAME = 'tasks'
      AND COLUMN_NAME IN ('type', 'priority')
    `);

    console.log('Updated columns:', updatedColumns);

    // Check some sample data
    const [sampleData] = await connection.execute(`
      SELECT id, title, type, priority 
      FROM tasks 
      LIMIT 5
    `);

    console.log('Sample data after migration:', sampleData);

  } catch (error) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration().catch(console.error); 
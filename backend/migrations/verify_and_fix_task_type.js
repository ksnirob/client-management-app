const mysql = require('mysql2/promise');

async function verifyAndFixTaskType() {
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

    // 1. Check current table structure
    const [tableInfo] = await connection.execute(`
      SHOW CREATE TABLE tasks
    `);
    console.log('\nCurrent table structure:', tableInfo[0]['Create Table']);

    // 2. Check type column definition
    const [columnInfo] = await connection.execute(`
      SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'client_management' 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'type'
    `);
    console.log('\nType column info:', columnInfo[0]);

    // 3. Check current values in type column
    const [types] = await connection.execute(`
      SELECT DISTINCT type, COUNT(*) as count 
      FROM tasks 
      GROUP BY type
    `);
    console.log('\nCurrent type values distribution:', types);

    // 4. Verify if we need to modify the column
    const shouldModifyColumn = !columnInfo[0].COLUMN_TYPE.includes("'design'") || 
                             !columnInfo[0].COLUMN_TYPE.includes("'fixing'") ||
                             !columnInfo[0].COLUMN_TYPE.includes("'feedback'");

    if (shouldModifyColumn) {
      console.log('\nModifying type column to ensure all values are supported...');
      
      // 5. Modify the column to support all required values
      await connection.execute(`
        ALTER TABLE tasks 
        MODIFY COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') 
        NOT NULL DEFAULT 'development'
      `);
      console.log('Column modified successfully');

      // 6. Verify the modification
      const [newColumnInfo] = await connection.execute(`
        SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'client_management' 
        AND TABLE_NAME = 'tasks' 
        AND COLUMN_NAME = 'type'
      `);
      console.log('\nUpdated type column info:', newColumnInfo[0]);
    } else {
      console.log('\nType column definition is correct');
    }

    // 7. Test updating a task type
    const [tasks] = await connection.execute('SELECT id FROM tasks LIMIT 1');
    if (tasks.length > 0) {
      const testId = tasks[0].id;
      console.log('\nTesting type update on task:', testId);

      // Try updating to each type value
      const types = ['development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3'];
      for (const type of types) {
        await connection.execute('UPDATE tasks SET type = ? WHERE id = ?', [type, testId]);
        const [updated] = await connection.execute('SELECT type FROM tasks WHERE id = ?', [testId]);
        console.log(`Updated to ${type}, actual value:`, updated[0].type);
      }
    }

    console.log('\nVerification and fixes completed successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the verification
verifyAndFixTaskType().catch(console.error); 
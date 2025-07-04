const mysql = require('mysql2/promise');

async function verifyData() {
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

    // Check table structure
    const [tableInfo] = await connection.execute(`
      SHOW CREATE TABLE tasks
    `);
    console.log('Table structure:', tableInfo[0]['Create Table']);

    // Check all tasks
    const [tasks] = await connection.execute(`
      SELECT id, title, type, priority, status 
      FROM tasks
    `);
    console.log('\nCurrent tasks:', tasks);

    // Try to update a test task with a different type
    const testTaskId = tasks[0]?.id;
    if (testTaskId) {
      console.log('\nTrying to update test task:', testTaskId);
      
      await connection.execute(`
        UPDATE tasks 
        SET type = 'design'
        WHERE id = ?
      `, [testTaskId]);

      const [updatedTask] = await connection.execute(`
        SELECT id, title, type, priority, status 
        FROM tasks 
        WHERE id = ?
      `, [testTaskId]);

      console.log('Updated task:', updatedTask[0]);
    }

    // Verify ENUM values
    const [columns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'client_management' 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'type'
    `);
    console.log('\nType column definition:', columns[0]);

    // Drop and recreate type column to ensure it's properly set up
    await connection.execute(`
      ALTER TABLE tasks 
      MODIFY COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') 
      NOT NULL DEFAULT 'development'
    `);

    console.log('\nColumn modified successfully');

    // Verify the changes
    const [finalTasks] = await connection.execute(`
      SELECT id, title, type, priority, status 
      FROM tasks
    `);
    console.log('\nFinal tasks state:', finalTasks);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyData().catch(console.error); 
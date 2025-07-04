const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'client_management'
    });

    console.log('Connected to database');

    await connection.query('ALTER TABLE tasks ADD COLUMN budget DECIMAL(10,2) DEFAULT NULL;');
    console.log('Budget column added to tasks table');

    await connection.end();
    console.log('Migration completed successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Budget column already exists');
    } else {
      console.error('Error running migration:', err);
    }
  }
}

runMigration(); 
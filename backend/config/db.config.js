const mysql = require('mysql2/promise');

// Log database configuration (without password)
console.log('Database Configuration:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'client_management'
});

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'client_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connection established successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// Test the connection and verify table structure
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    console.error('Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'client_management',
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      fatal: err.fatal
    });
    return;
  }
  console.log('Successfully connected to MySQL database');
  
  // Test table access
  connection.query('SHOW TABLES', (error, results) => {
    if (error) {
      console.error('Error checking tables:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
    } else {
      console.log('Available tables:', results);
    }
  });

  // Test clients table structure
  connection.query('DESCRIBE clients', (error, results) => {
    if (error) {
      console.error('Error checking clients table structure:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
    } else {
      console.log('Clients table structure:', results.map(row => ({
        Field: row.Field,
        Type: row.Type,
        Null: row.Null,
        Key: row.Key,
        Default: row.Default
      })));
    }
  });

  connection.release();
});

// Add error handler
pool.on('error', err => {
  console.error('Database pool error:', err);
  console.error('Error details:', {
    code: err.code,
    errno: err.errno,
    syscall: err.syscall,
    fatal: err.fatal
  });
});

// Add connection handler
pool.on('connection', connection => {
  console.log('New database connection established');
  connection.on('error', err => {
    console.error('Database connection error:', err);
  });
});

module.exports = pool; 
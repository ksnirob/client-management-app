const db = require('./config/db.config');

async function testDatabase() {
  let connection;
  try {
    console.log('Testing database connection and operations...');

    // Get a connection
    connection = await db.getConnection();
    console.log('Successfully got connection');

    // Test 1: Check if clients table exists
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:', tables);

    // Test 2: Check clients table structure
    const [columns] = await connection.execute('DESCRIBE clients');
    console.log('Clients table structure:', columns);

    // Test 3: Try to read a client
    const [clients] = await connection.execute('SELECT * FROM clients LIMIT 1');
    console.log('Sample client:', JSON.stringify(clients[0], null, 2));

    // Test 4: Try a test update
    if (clients[0]) {
      const testId = clients[0].id;
      const currentCountry = clients[0].country;
      const newCountry = currentCountry === 'Test' ? 'Test2' : 'Test';

      console.log(`Attempting test update on client ${testId}...`);
      console.log('Current country:', currentCountry);
      console.log('New country:', newCountry);

      // Start transaction
      await connection.beginTransaction();

      // Perform update
      const [updateResult] = await connection.execute(
        'UPDATE clients SET country = ? WHERE id = ?',
        [newCountry, testId]
      );

      console.log('Update result:', {
        affectedRows: updateResult.affectedRows,
        changedRows: updateResult.changedRows,
        info: updateResult.info,
        warningStatus: updateResult.warningStatus
      });

      // Verify update
      const [updatedClient] = await connection.execute(
        'SELECT * FROM clients WHERE id = ?',
        [testId]
      );

      console.log('Updated client:', JSON.stringify(updatedClient[0], null, 2));

      // Commit transaction
      await connection.commit();
      console.log('Transaction committed');

      // Verify final state
      const [finalState] = await connection.execute(
        'SELECT * FROM clients WHERE id = ?',
        [testId]
      );

      console.log('Final state:', JSON.stringify(finalState[0], null, 2));
    }

    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });

    if (connection) {
      try {
        await connection.rollback();
        console.log('Rolled back any pending changes');
      } catch (rollbackError) {
        console.error('Error rolling back:', rollbackError);
      }
    }
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('Connection released');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
    // Close the pool
    await db.end();
  }
}

// Run the tests
testDatabase().then(() => {
  console.log('Database testing completed');
}).catch(err => {
  console.error('Error during database testing:', err);
}); 
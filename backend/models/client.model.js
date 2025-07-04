const db = require('../config/db.config');

class Client {
  static async findAll() {
    try {
      console.log('Starting findAll operation for clients');
      
      // First get all clients
      const [clients] = await db.execute('SELECT * FROM clients ORDER BY created_at DESC');
      console.log(`Found ${clients.length} clients`);
      
      // Then get all projects
      const [projects] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
      `);
      console.log(`Found ${projects.length} projects`);
      
      // Attach projects to their respective clients and ensure consistent field handling
      const clientsWithProjects = clients.map(client => {
        const clientProjects = projects.filter(project => project.client_id === client.id);
        console.log(`Client ${client.id} has ${clientProjects.length} projects`);
        
        // Parse social contacts
        let socialContacts = null;
        if (client.social_contacts) {
          try {
            socialContacts = typeof client.social_contacts === 'string'
              ? JSON.parse(client.social_contacts)
              : client.social_contacts;
            console.log(`Parsed social contacts for client ${client.id}:`, socialContacts);
          } catch (e) {
            console.warn(`Failed to parse social_contacts for client ${client.id}:`, e);
          }
        }
        
        // Ensure consistent field handling
        return {
          id: client.id,
          company_name: client.company_name,
          contact_person: client.contact_person || client.company_name,
          email: client.email,
          phone: client.phone || '',
          address: client.address || '',
          country: client.country || null,
          social_contacts: socialContacts,
          status: client.status || 'active',
          created_at: client.created_at,
          updated_at: client.updated_at,
          projects: clientProjects || []
        };
      });
      
      console.log('Successfully prepared clients with projects');
      return clientsWithProjects;
    } catch (error) {
      console.error('Error in Client.findAll:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      throw error;
    }
  }

  static async findById(id) {
    try {
      // Get client
      const [clients] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
      if (!clients[0]) return null;
      
      // Get client's projects
      const [projects] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.client_id = ?
      `, [id]);
      
      // Parse social contacts
      let socialContacts = null;
      if (clients[0].social_contacts) {
        try {
          socialContacts = typeof clients[0].social_contacts === 'string'
            ? JSON.parse(clients[0].social_contacts)
            : clients[0].social_contacts;
          console.log(`Parsed social contacts for client ${id}:`, socialContacts);
        } catch (e) {
          console.warn(`Failed to parse social_contacts for client ${id}:`, e);
        }
      }
      
      // Return client with consistent field handling
      return {
        id: clients[0].id,
        company_name: clients[0].company_name,
        contact_person: clients[0].contact_person || clients[0].company_name,
        email: clients[0].email,
        phone: clients[0].phone || '',
        address: clients[0].address || '',
        country: clients[0].country || null,
        social_contacts: socialContacts,
        status: clients[0].status || 'active',
        created_at: clients[0].created_at,
        updated_at: clients[0].updated_at,
        projects: projects || []
      };
    } catch (error) {
      console.error('Error in Client.findById:', error);
      throw error;
    }
  }

  static async create(clientData) {
    try {
      console.log('Creating client with data:', JSON.stringify(clientData, null, 2));
      
      // Ensure social_contacts is properly formatted
      let socialContactsJson = null;
      if (clientData.social_contacts && Object.keys(clientData.social_contacts).length > 0) {
        try {
          // If it's already a string, parse it to validate and re-stringify
          if (typeof clientData.social_contacts === 'string') {
            socialContactsJson = JSON.stringify(JSON.parse(clientData.social_contacts));
          } else {
            // If it's an object, stringify it
            socialContactsJson = JSON.stringify(clientData.social_contacts);
          }
          console.log('Formatted social contacts:', socialContactsJson);
        } catch (e) {
          console.error('Error formatting social contacts:', e);
          socialContactsJson = null;
        }
      }
      
      const [result] = await db.execute(
        'INSERT INTO clients (company_name, contact_person, email, phone, address, country, social_contacts, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [clientData.company_name, clientData.contact_person, clientData.email, clientData.phone, clientData.address, clientData.country, socialContactsJson, clientData.status]
      );
      
      const newClient = { 
        id: result.insertId, 
        ...clientData,
        social_contacts: socialContactsJson ? JSON.parse(socialContactsJson) : null,
        projects: [] 
      };
      
      console.log('Created client:', JSON.stringify(newClient, null, 2));
      return newClient;
    } catch (error) {
      console.error('Error in Client.create:', error);
      throw error;
    }
  }

  static async update(id, clientData) {
    let connection;
    try {
      console.log('Starting client update:', { id, clientData });

      // Validate required fields
      if (!clientData.company_name || !clientData.email) {
        throw new Error('Company name and email are required');
      }

      // Get a connection from the pool
      connection = await db.getConnection();
      console.log('Got database connection');
      
      // Start transaction
      await connection.beginTransaction();
      console.log('Transaction started');

      // Log the current state in database
      const [currentClient] = await connection.execute('SELECT * FROM clients WHERE id = ?', [id]);
      console.log('Current client in database:', JSON.stringify(currentClient[0], null, 2));

      if (!currentClient[0]) {
        throw new Error(`No client found with id ${id}`);
      }

      // Ensure social_contacts is properly formatted
      let socialContactsJson = null;
      if (clientData.social_contacts && Object.keys(clientData.social_contacts).length > 0) {
        try {
          // If it's already a string, parse it to validate and re-stringify
          if (typeof clientData.social_contacts === 'string') {
            socialContactsJson = JSON.stringify(JSON.parse(clientData.social_contacts));
          } else {
            // If it's an object, stringify it
            socialContactsJson = JSON.stringify(clientData.social_contacts);
          }
          console.log('Formatted social contacts:', socialContactsJson);
        } catch (e) {
          console.error('Error formatting social contacts:', e);
          socialContactsJson = null;
        }
      }

      // Prepare update query with all fields
      const query = `
        UPDATE clients 
        SET company_name = ?,
            contact_person = ?,
            email = ?,
            phone = ?,
            address = ?,
            country = ?,
            social_contacts = ?,
            status = ?,
            updated_at = NOW()
        WHERE id = ?
      `;

      const params = [
        clientData.company_name,
        clientData.contact_person || clientData.company_name,
        clientData.email,
        clientData.phone || '',
        clientData.address || '',
        clientData.country,
        socialContactsJson,
        clientData.status || 'active',
        id
      ];

      console.log('Executing update query:', {
        query: query.replace(/\s+/g, ' '),
        params: JSON.stringify(params, null, 2),
        paramTypes: params.map(p => typeof p),
        socialContactsOriginal: clientData.social_contacts,
        socialContactsJson: socialContactsJson
      });

      // Execute the update
      const [updateResult] = await connection.execute(query, params);
      console.log('Update result:', updateResult);

      if (updateResult.affectedRows === 0) {
        throw new Error(`Failed to update client ${id}`);
      }

      // Get the updated client data
      const [clients] = await connection.execute('SELECT * FROM clients WHERE id = ?', [id]);
      console.log('Updated client in database:', JSON.stringify(clients[0], null, 2));

      // Get client's projects
      const [projects] = await connection.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.client_id = ?
      `, [id]);

      // Commit the transaction
      await connection.commit();
      console.log('Transaction committed');

      // Return complete client data with validated fields
      const updatedClient = {
        id: clients[0].id,
        company_name: clients[0].company_name,
        contact_person: clients[0].contact_person || clients[0].company_name,
        email: clients[0].email,
        phone: clients[0].phone || '',
        address: clients[0].address || '',
        country: clients[0].country || null,
        social_contacts: (() => {
          try {
            return clients[0].social_contacts ? JSON.parse(clients[0].social_contacts) : null;
          } catch (e) {
            console.warn(`Failed to parse social_contacts for client ${clients[0].id}:`, e);
            return null;
          }
        })(),
        status: clients[0].status || 'active',
        created_at: clients[0].created_at,
        updated_at: clients[0].updated_at,
        projects: projects || []
      };

      console.log('Returning updated client:', JSON.stringify(updatedClient, null, 2));
      return updatedClient;
    } catch (error) {
      console.error('Error in Client.update:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        stack: error.stack
      });
      
      // Rollback transaction on error
      if (connection) {
        try {
          await connection.rollback();
          console.log('Transaction rolled back due to error');
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }
      
      throw error;
    } finally {
      // Release connection back to the pool
      if (connection) {
        try {
          connection.release();
          console.log('Database connection released');
        } catch (releaseError) {
          console.error('Error releasing connection:', releaseError);
        }
      }
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM clients WHERE id = ?', [id]);
      return { id };
    } catch (error) {
      console.error('Error in Client.delete:', error);
      throw error;
    }
  }

  static async getDashboardStats() {
    try {
      const [clientCount] = await db.execute('SELECT COUNT(*) as count FROM clients');
      const [activeClients] = await db.execute("SELECT COUNT(*) as count FROM clients WHERE status = 'active'");
      const [projectCount] = await db.execute('SELECT COUNT(*) as count FROM projects');
      const [activeProjects] = await db.execute("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'");
      
      return {
        totalClients: clientCount[0].count,
        activeClients: activeClients[0].count,
        totalProjects: projectCount[0].count,
        activeProjects: activeProjects[0].count
      };
    } catch (error) {
      console.error('Error in Client.getDashboardStats:', error);
      throw error;
    }
  }
}

module.exports = Client; 
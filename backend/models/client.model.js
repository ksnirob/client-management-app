const db = require('../config/db.config');

class Client {
  static async findAll() {
    try {
      // First get all clients
      const [clients] = await db.execute('SELECT * FROM clients');
      
      // Then get all projects
      const [projects] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
      `);
      
      // Attach projects to their respective clients
      const clientsWithProjects = clients.map(client => ({
        ...client,
        projects: projects.filter(project => project.client_id === client.id)
      }));
      
      return clientsWithProjects;
    } catch (error) {
      console.error('Error in Client.findAll:', error);
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
      
      return {
        ...clients[0],
        projects
      };
    } catch (error) {
      console.error('Error in Client.findById:', error);
      throw error;
    }
  }

  static async create(clientData) {
    try {
      const [result] = await db.execute(
        'INSERT INTO clients (company_name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
        [clientData.company_name, clientData.contact_person, clientData.email, clientData.phone, clientData.address, clientData.status]
      );
      return { id: result.insertId, ...clientData, projects: [] };
    } catch (error) {
      console.error('Error in Client.create:', error);
      throw error;
    }
  }

  static async update(id, clientData) {
    try {
      const [result] = await db.execute(
        'UPDATE clients SET company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?',
        [clientData.company_name, clientData.contact_person, clientData.email, clientData.phone, clientData.address, clientData.status, id]
      );
      return { id, ...clientData };
    } catch (error) {
      console.error('Error in Client.update:', error);
      throw error;
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
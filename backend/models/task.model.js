const db = require('../config/db.config');

class Task {
  static async findAll() {
    try {
      console.log('Fetching all tasks');
      
      // Log the query for debugging
      const query = `
        SELECT 
          t.*,
          c.company_name as client_name,
          u.name as assigned_to_name,
          CASE 
            WHEN p.id IS NOT NULL THEN p.title 
            ELSE 'No Project' 
          END as project_title
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC
      `;
      console.log('Executing query:', query);
      
      const [rows] = await db.execute(query);
      
      // Log each task's project info for debugging
      rows.forEach(task => {
        console.log(`Task ${task.id} project info:`, {
          project_id: task.project_id,
          project_title: task.project_title
        });
      });
      
      return rows;
    } catch (error) {
      console.error('Error in Task.findAll:', error);
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
      const [rows] = await db.execute(`
        SELECT 
          t.*,
          c.company_name as client_name,
          u.name as assigned_to_name,
          CASE 
            WHEN p.id IS NOT NULL THEN p.title 
            ELSE 'No Project' 
          END as project_title
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      console.error('Error in Task.findById:', error);
      throw error;
    }
  }

  static async create(taskData) {
    try {
      console.log('Creating task with data:', taskData);
      
      // Validate required fields
      const requiredFields = ['title', 'project_id', 'client_id', 'status', 'priority', 'due_date'];
      const missingFields = requiredFields.filter(field => !taskData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate project_id exists
      const [projectExists] = await db.execute(
        'SELECT id, title FROM projects WHERE id = ?',
        [taskData.project_id]
      );
      
      if (!projectExists.length) {
        throw new Error(`Project with id ${taskData.project_id} does not exist`);
      }

      // Log the values for debugging
      console.log('Task values:', {
        title: taskData.title,
        description: taskData.description || null,
        project_id: taskData.project_id,
        client_id: taskData.client_id,
        assigned_to: taskData.assigned_to || null,
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date
      });

      // Create base query with timestamps
      const query = `
        INSERT INTO tasks (
          title, description, project_id, client_id, assigned_to, 
          status, priority, due_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const params = [
        taskData.title,
        taskData.description || null,
        taskData.project_id,
        taskData.client_id,
        taskData.assigned_to || null,
        taskData.status,
        taskData.priority,
        taskData.due_date
      ];
      
      console.log('Executing query:', query.replace(/\s+/g, ' '));
      console.log('With parameters:', params);
      
      const [result] = await db.execute(query, params);
      console.log('Task created successfully:', result);
      
      // Verify the task was created with project_id
      const [createdTask] = await db.execute(`
        SELECT 
          t.*,
          c.company_name as client_name,
          u.name as assigned_to_name,
          CASE 
            WHEN p.id IS NOT NULL THEN p.title 
            ELSE 'No Project' 
          END as project_title
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `, [result.insertId]);
      
      if (!createdTask[0]) {
        throw new Error('Task was created but could not be retrieved');
      }

      console.log('Created task with project details:', createdTask[0]);
      
      return createdTask[0];
    } catch (error) {
      console.error('Error in Task.create:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      console.error('Task data that caused error:', taskData);
      throw error;
    }
  }

  static async update(id, taskData) {
    try {
      console.log('Updating task with data:', taskData);
      
      // Create base query with updated_at timestamp
      const query = `
        UPDATE tasks 
        SET title=?, description=?, project_id=?, client_id=?, assigned_to=?, 
            status=?, priority=?, due_date=?, updated_at=NOW() 
        WHERE id=?
      `;
      
      const params = [
        taskData.title,
        taskData.description || null,
        taskData.project_id,
        taskData.client_id,
        taskData.assigned_to || null,
        taskData.status,
        taskData.priority,
        taskData.due_date,
        id
      ];
      
      console.log('Executing update query:', query.replace(/\s+/g, ' '));
      console.log('With parameters:', params);
      
      const [result] = await db.execute(query, params);
      
      // Fetch the updated task
      const [rows] = await db.execute(`
        SELECT 
          t.*,
          c.company_name as client_name,
          u.name as assigned_to_name,
          CASE 
            WHEN p.id IS NOT NULL THEN p.title 
            ELSE 'No Project' 
          END as project_title
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `, [id]);
      
      if (!rows[0]) {
        throw new Error('Task was updated but could not be retrieved');
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error in Task.update:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      console.error('Task data that caused error:', taskData);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM tasks WHERE id=?', [id]);
      return { id };
    } catch (error) {
      console.error('Error in Task.delete:', error);
      throw error;
    }
  }
}

module.exports = Task; 
const db = require('../config/db.config');

class Project {
  static async findAll() {
    try {
      console.log('Fetching all projects with task counts and calculated budgets');
      
      // First get basic project data
      const [projects] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
      `);
      console.log('Basic project data:', projects);

      // Then get task counts, status, and calculated budgets separately
      const projectPromises = projects.map(async (project) => {
        const [tasks] = await db.execute(
          'SELECT id, status FROM tasks WHERE project_id = ?',
          [project.id]
        );
        
        // Calculate total budget including payments
        const [transactionResult] = await db.execute(`
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as total_payments,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
          FROM transactions 
          WHERE project_id = ? AND status = 'completed'
        `, [project.id]);
        
        const staticBudget = Number(project.budget) || 0;
        const totalPayments = Number(transactionResult[0]?.total_payments) || 0;
        const totalExpenses = Number(transactionResult[0]?.total_expenses) || 0;
        
        // Total budget = Static budget + Payments - Expenses
        const calculatedBudget = staticBudget + totalPayments - totalExpenses;
        
        console.log(`Project ${project.id} budget calculation:`, {
          staticBudget,
          totalPayments,
          totalExpenses,
          calculatedBudget
        });
        
        console.log(`Tasks for project ${project.id}:`, tasks);
        
        // Only auto-update status to in_progress if current status is not_started
        // and there are active tasks
        let projectStatus = project.status;
        if (project.status === 'not_started' && tasks.length > 0 && 
            tasks.some(task => task.status !== 'completed')) {
          projectStatus = 'in_progress';
        }
        
        return {
          ...project,
          task_count: tasks.length,
          status: projectStatus,
          budget: calculatedBudget, // Use calculated budget instead of static budget
          static_budget: staticBudget, // Keep original budget for reference
          total_payments: totalPayments,
          total_expenses: totalExpenses
        };
      });

      const projectsWithInfo = await Promise.all(projectPromises);
      console.log('Final projects with counts, status, and calculated budgets:', projectsWithInfo);
      
      return projectsWithInfo;
    } catch (error) {
      console.error('Error in Project.findAll:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        stack: error.stack
      });
      throw error;
    }
  }

  static async findById(id) {
    try {
      // Get project with client name
      const [projects] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `, [id]);

      if (!projects[0]) {
        throw new Error(`Project with id ${id} not found`);
      }

      // Get tasks for this project
      const [tasks] = await db.execute(`
        SELECT 
          t.*,
          u.name as assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?
        ORDER BY t.created_at DESC
      `, [id]);

      // Calculate total budget including payments
      const [transactionResult] = await db.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as total_payments,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
        FROM transactions 
        WHERE project_id = ? AND status = 'completed'
      `, [id]);
      
      const staticBudget = Number(projects[0].budget) || 0;
      const totalPayments = Number(transactionResult[0]?.total_payments) || 0;
      const totalExpenses = Number(transactionResult[0]?.total_expenses) || 0;
      
      // Total budget = Static budget + Payments - Expenses
      const calculatedBudget = staticBudget + totalPayments - totalExpenses;

      // Only auto-update status to in_progress if current status is not_started
      // and there are active tasks
      let projectStatus = projects[0].status;
      if (projects[0].status === 'not_started' && tasks.length > 0 && 
          tasks.some(task => task.status !== 'completed')) {
        projectStatus = 'in_progress';
      }

      // Return project with tasks, updated status, and calculated budget
      return {
        ...projects[0],
        status: projectStatus,
        tasks: tasks || [],
        budget: calculatedBudget, // Use calculated budget
        static_budget: staticBudget, // Keep original budget for reference
        total_payments: totalPayments,
        total_expenses: totalExpenses
      };
    } catch (error) {
      console.error('Error in Project.findById:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      throw error;
    }
  }

  static async create(projectData) {
    try {
      console.log('Creating project with data:', projectData);

      // Validate required fields
      const requiredFields = ['title', 'client_id'];
      const missingFields = requiredFields.filter(field => !projectData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate client exists
      const [clientExists] = await db.execute(
        'SELECT id FROM clients WHERE id = ?',
        [projectData.client_id]
      );
      
      if (!clientExists.length) {
        throw new Error(`Client with id ${projectData.client_id} does not exist`);
      }

      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toISOString().split('T')[0];
      };

      // Create project
      const [result] = await db.execute(
        'INSERT INTO projects (title, description, client_id, status, start_date, end_date, budget, project_live_url, project_files, admin_login_url, username_email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          projectData.title,
          projectData.description || null,
          projectData.client_id,
          projectData.status || 'not_started',
          formatDate(projectData.start_date),
          formatDate(projectData.end_date),
          projectData.budget || null,
          projectData.project_live_url || null,
          projectData.project_files || null,
          projectData.admin_login_url || null,
          projectData.username_email || null,
          projectData.password || null
        ]
      );
      
      // Fetch the created project with client name
      const [rows] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name,
          0 as task_count
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `, [result.insertId]);
      
      if (!rows[0]) {
        throw new Error('Project was created but could not be retrieved');
      }

      console.log('Created project:', rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Error in Project.create:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      console.error('Project data that caused error:', projectData);
      throw error;
    }
  }

  static async update(id, projectData) {
    try {
      console.log('Updating project with data:', projectData);

      // Check if project exists and get current data
      const [existingProject] = await db.execute(
        'SELECT * FROM projects WHERE id = ?',
          [id]
        );
        
      if (!existingProject.length) {
        throw new Error(`Project with id ${id} not found`);
      }

      // Validate status if provided
      if (projectData.status) {
        const validStatuses = ['not_started', 'pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(projectData.status)) {
          throw new Error(`Invalid status: ${projectData.status}`);
        }
      }

      // Format dates - handle both updating and clearing dates
      const formatDate = (dateStr) => {
        if (dateStr === null || dateStr === '') return null;
        if (!dateStr) return undefined; // Use undefined to preserve existing value
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return undefined; // Invalid date, preserve existing
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.warn('Invalid date format:', dateStr);
          return undefined; // Preserve existing value for invalid dates
        }
      };

      // Process dates with proper fallback logic
      const processedStartDate = formatDate(projectData.start_date);
      const processedEndDate = formatDate(projectData.end_date);
      
      console.log('Date processing:', {
        input_start: projectData.start_date,
        input_end: projectData.end_date,
        processed_start: processedStartDate,
        processed_end: processedEndDate,
        existing_start: existingProject[0].start_date,
        existing_end: existingProject[0].end_date
      });

      // Create base query with updated_at timestamp
      const query = `
        UPDATE projects 
        SET title = ?,
            description = ?,
            client_id = ?,
            status = ?,
            start_date = ?,
            end_date = ?,
            budget = ?,
            project_live_url = ?,
            project_files = ?,
            admin_login_url = ?,
            username_email = ?,
            password = ?,
            updated_at = NOW()
        WHERE id = ?
      `;
      
      const params = [
        projectData.title || existingProject[0].title,
        projectData.description !== undefined ? projectData.description : existingProject[0].description,
        projectData.client_id || existingProject[0].client_id,
        projectData.status || existingProject[0].status,
        processedStartDate !== undefined ? processedStartDate : existingProject[0].start_date,
        processedEndDate !== undefined ? processedEndDate : existingProject[0].end_date,
        projectData.budget !== undefined ? projectData.budget : existingProject[0].budget,
        projectData.project_live_url !== undefined ? projectData.project_live_url : existingProject[0].project_live_url,
        projectData.project_files !== undefined ? projectData.project_files : existingProject[0].project_files,
        projectData.admin_login_url !== undefined ? projectData.admin_login_url : existingProject[0].admin_login_url,
        projectData.username_email !== undefined ? projectData.username_email : existingProject[0].username_email,
        projectData.password !== undefined ? projectData.password : existingProject[0].password,
        id
      ];

      console.log('Executing update query:', query.replace(/\s+/g, ' '));
      console.log('With parameters:', params);
      
      const [result] = await db.execute(query, params);
      
      // Fetch the updated project with client name and calculated budget
      const [rows] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `, [id]);
      
      if (!rows[0]) {
        throw new Error('Project was updated but could not be retrieved');
      }

      // Calculate budget like in findById
      const [transactionResult] = await db.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as total_payments,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
        FROM transactions 
        WHERE project_id = ? AND status = 'completed'
      `, [id]);
      
      const staticBudget = Number(rows[0].budget) || 0;
      const totalPayments = Number(transactionResult[0]?.total_payments) || 0;
      const totalExpenses = Number(transactionResult[0]?.total_expenses) || 0;
      const calculatedBudget = staticBudget + totalPayments - totalExpenses;

      const updatedProject = {
        ...rows[0],
        budget: calculatedBudget,
        static_budget: staticBudget,
        total_payments: totalPayments,
        total_expenses: totalExpenses
      };

      console.log('Updated project:', updatedProject);
      return updatedProject;
    } catch (error) {
      console.error('Error in Project.update:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      console.error('Project data that caused error:', projectData);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM projects WHERE id=?', [id]);
      return { id };
    } catch (error) {
      console.error('Error in Project.delete:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      throw error;
    }
  }
}

module.exports = Project; 
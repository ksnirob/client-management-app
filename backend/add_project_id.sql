USE client_management;
ALTER TABLE tasks ADD COLUMN project_id INT;
ALTER TABLE tasks ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL; 
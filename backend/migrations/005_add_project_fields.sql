-- Migration to add new project fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_live_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS project_files TEXT,
ADD COLUMN IF NOT EXISTS admin_login_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS username_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS password VARCHAR(255); 
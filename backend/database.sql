CREATE DATABASE IF NOT EXISTS client_management;
USE client_management;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INT,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INT,
    project_id INT,
    assigned_to INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Insert test data for clients
INSERT IGNORE INTO clients (company_name, contact_person, email, phone, address, status) VALUES
('Test Company 1', 'John Doe', 'john@testcompany1.com', '123-456-7890', '123 Test St, Test City', 'active'),
('Test Company 2', 'Jane Smith', 'jane@testcompany2.com', '098-765-4321', '456 Test Ave, Test Town', 'active'),
('Test Company 3', 'Bob Wilson', 'bob@testcompany3.com', '555-555-5555', '789 Test Blvd, Test Village', 'inactive');

-- Insert test data for users
INSERT IGNORE INTO users (name, email) VALUES
('Alice Johnson', 'alice@example.com'),
('Bob Smith', 'bob@example.com'),
('Carol White', 'carol@example.com');

-- Insert test data for projects
INSERT IGNORE INTO projects (title, description, client_id, status, start_date, end_date, budget) VALUES
('Website Redesign', 'Complete redesign of company website', 1, 'in_progress', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 5000.00),
('Social Media Campaign', 'Q2 social media marketing campaign', 1, 'not_started', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 3000.00),
('Brand Identity Update', 'Update company branding and guidelines', 2, 'in_progress', DATE_ADD(CURRENT_DATE, INTERVAL -7 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 4000.00),
('Market Research', 'Competitor analysis and market study', 2, 'completed', DATE_ADD(CURRENT_DATE, INTERVAL -30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY), 2500.00),
('Product Launch', 'New product launch campaign', 3, 'not_started', DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 6000.00);

-- Insert test data for tasks
INSERT IGNORE INTO tasks (title, description, client_id, project_id, assigned_to, status, priority, due_date) VALUES
('Website Redesign', 'Complete redesign of company website with modern UI/UX', 1, 1, 1, 'in_progress', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)),
('Social Media Campaign', 'Launch new social media campaign for Q2', 1, 2, 2, 'pending', 'medium', DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY)),
('Client Meeting', 'Prepare presentation for quarterly review', 2, 3, 1, 'completed', 'high', DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY)),
('Content Update', 'Update product descriptions and pricing', 2, 4, 3, 'pending', 'low', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY)),
('Market Research', 'Conduct competitor analysis for new market', 3, 5, 2, 'in_progress', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY)); 
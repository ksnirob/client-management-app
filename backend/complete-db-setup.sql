CREATE DATABASE IF NOT EXISTS client_management;
USE client_management;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    social_contacts JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INT,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    project_live_url VARCHAR(500),
    project_files TEXT,
    admin_login_url VARCHAR(500),
    username_email VARCHAR(255),
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INT,
    project_id INT,
    assigned_to INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'not_started') DEFAULT 'pending',
    type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') DEFAULT 'development',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    budget DECIMAL(10,2) DEFAULT NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Create transactions table for finance management
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('invoice', 'payment', 'expense') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    project_id INT,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Insert sample data for users
INSERT IGNORE INTO users (name, email) VALUES
('Alice Johnson', 'alice@example.com'),
('Bob Smith', 'bob@example.com'),
('Carol White', 'carol@example.com');

-- Insert sample data for clients
INSERT IGNORE INTO clients (company_name, contact_person, email, phone, address, country, status) VALUES
('Tech Solutions Inc', 'John Doe', 'john@techsolutions.com', '123-456-7890', '123 Tech Street, Silicon Valley', 'United States', 'active'),
('Digital Marketing Pro', 'Jane Smith', 'jane@digitalmarketing.com', '098-765-4321', '456 Marketing Ave, New York', 'United States', 'active'),
('Global Innovations Ltd', 'Bob Wilson', 'bob@globalinnovations.com', '555-555-5555', '789 Innovation Blvd, London', 'United Kingdom', 'active'),
('Startup Ventures', 'Sarah Johnson', 'sarah@startupventures.com', '444-444-4444', '321 Startup St, Austin', 'United States', 'inactive');

-- Insert sample data for projects
INSERT IGNORE INTO projects (title, description, client_id, status, start_date, end_date, budget, project_live_url, admin_login_url, username_email) VALUES
('E-commerce Website', 'Complete e-commerce platform with payment integration', 1, 'in_progress', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 8500.00, 'https://techsolutions-store.com', 'https://admin.techsolutions-store.com', 'admin@techsolutions.com'),
('Social Media Campaign', 'Q2 social media marketing campaign across platforms', 2, 'not_started', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), 3500.00, NULL, NULL, NULL),
('Brand Identity Redesign', 'Complete brand overhaul including logo and guidelines', 3, 'in_progress', DATE_ADD(CURRENT_DATE, INTERVAL -14 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 28 DAY), 5200.00, NULL, NULL, NULL),
('Mobile App Development', 'Cross-platform mobile application', 1, 'not_started', DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 120 DAY), 12000.00, NULL, NULL, NULL);

-- Insert sample data for tasks
INSERT IGNORE INTO tasks (title, description, client_id, project_id, assigned_to, status, type, priority, budget, due_date) VALUES
('Homepage Design', 'Create responsive homepage design mockups', 1, 1, 1, 'in_progress', 'design', 'high', 1200.00, DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY)),
('Payment Gateway Integration', 'Integrate Stripe payment processing', 1, 1, 2, 'pending', 'development', 'high', 2000.00, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY)),
('Product Catalog Setup', 'Set up product catalog and inventory management', 1, 1, 3, 'pending', 'development', 'medium', 1500.00, DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY)),
('Social Media Strategy', 'Develop comprehensive social media strategy', 2, 2, 1, 'not_started', 'feedback', 'medium', 800.00, DATE_ADD(CURRENT_DATE, INTERVAL 20 DAY)),
('Logo Design Concepts', 'Create initial logo design concepts', 3, 3, 2, 'completed', 'design', 'high', 1000.00, DATE_ADD(CURRENT_DATE, INTERVAL -5 DAY)),
('Brand Guidelines Document', 'Create comprehensive brand guidelines', 3, 3, 3, 'in_progress', 'design', 'medium', 1200.00, DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY));

-- Insert sample transactions
INSERT IGNORE INTO transactions (type, amount, description, project_id, status, date) VALUES
('invoice', 2500.00, 'Initial payment for e-commerce website project', 1, 'completed', DATE_ADD(CURRENT_DATE, INTERVAL -10 DAY)),
('payment', 2500.00, 'Client payment received for project milestone', 1, 'completed', DATE_ADD(CURRENT_DATE, INTERVAL -8 DAY)),
('expense', 150.00, 'Domain and hosting setup for client project', 1, 'completed', DATE_ADD(CURRENT_DATE, INTERVAL -5 DAY)),
('invoice', 1500.00, 'Logo design milestone payment', 3, 'pending', CURRENT_DATE),
('expense', 50.00, 'Stock photo license for brand materials', 3, 'completed', DATE_ADD(CURRENT_DATE, INTERVAL -2 DAY));

-- Display success message
SELECT 'Database setup completed successfully!' as message;
SELECT 'Tables created: users, clients, projects, tasks, transactions' as tables_created; 
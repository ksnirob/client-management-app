-- Add missing project statuses
ALTER TABLE projects MODIFY COLUMN status ENUM('not_started', 'pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'not_started'; 
-- Migration to add 'not_started' status to tasks
ALTER TABLE tasks 
MODIFY status ENUM('not_started', 'pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'not_started'; 
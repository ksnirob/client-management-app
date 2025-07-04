-- Migration to update project status enum
ALTER TABLE projects 
MODIFY status ENUM('not_started', 'pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'not_started'; 
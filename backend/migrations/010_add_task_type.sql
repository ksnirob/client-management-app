USE client_management;

ALTER TABLE tasks
ADD COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') DEFAULT 'development' AFTER status;

-- Update existing tasks with default types
UPDATE tasks SET type = 'development' WHERE type IS NULL; 
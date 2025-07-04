-- First, backup the tasks table
CREATE TABLE IF NOT EXISTS tasks_backup_fix AS SELECT * FROM tasks;

-- Show current table structure
SHOW CREATE TABLE tasks;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS before_task_insert;
DROP TRIGGER IF EXISTS before_task_update;

-- Recreate the type column with correct ENUM values
ALTER TABLE tasks MODIFY COLUMN type VARCHAR(20);
UPDATE tasks SET type = 'development' WHERE type NOT IN ('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3');
ALTER TABLE tasks MODIFY COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') NOT NULL DEFAULT 'development';

-- Create triggers to enforce valid values
DELIMITER //

CREATE TRIGGER before_task_insert 
BEFORE INSERT ON tasks
FOR EACH ROW 
BEGIN
    IF NEW.type NOT IN ('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') THEN
        SET NEW.type = 'development';
    END IF;
END//

CREATE TRIGGER before_task_update
BEFORE UPDATE ON tasks
FOR EACH ROW 
BEGIN
    IF NEW.type NOT IN ('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') THEN
        SET NEW.type = OLD.type;
    END IF;
END//

DELIMITER ;

-- Verify the changes
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'tasks' 
AND COLUMN_NAME = 'type';

-- Show a sample of tasks with their types
SELECT id, title, type FROM tasks LIMIT 5; 
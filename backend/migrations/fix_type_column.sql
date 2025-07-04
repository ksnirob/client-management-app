-- First, let's check the current column definition
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'tasks' 
AND COLUMN_NAME = 'type';

-- Backup the current data
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;

-- Drop any existing triggers
DROP TRIGGER IF EXISTS before_task_insert;
DROP TRIGGER IF EXISTS before_task_update;

-- Modify the column to use VARCHAR first to avoid any enum conversion issues
ALTER TABLE tasks MODIFY COLUMN type VARCHAR(20) NOT NULL DEFAULT 'development';

-- Now convert it to ENUM with the correct values
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
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'tasks' 
AND COLUMN_NAME = 'type'; 
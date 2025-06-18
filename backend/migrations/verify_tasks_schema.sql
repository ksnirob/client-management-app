-- Verify current type column
SELECT COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'tasks'
AND COLUMN_NAME = 'type';

-- Drop existing type column if it exists and recreate with correct enum
ALTER TABLE tasks MODIFY COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') NOT NULL DEFAULT 'development';

-- Add trigger to ensure type values are always valid
DROP TRIGGER IF EXISTS before_task_update;
CREATE TRIGGER before_task_update
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NEW.type NOT IN ('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') THEN
        SET NEW.type = OLD.type;
    END IF;
END; 
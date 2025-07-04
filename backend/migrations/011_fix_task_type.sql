USE client_management;

-- Drop and recreate the type column with correct ENUM values and constraints
ALTER TABLE tasks 
MODIFY COLUMN type ENUM('development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3') 
NOT NULL DEFAULT 'development';

-- Update any NULL values to default
UPDATE tasks SET type = 'development' WHERE type IS NULL;

-- Verify the changes
SELECT DISTINCT type, COUNT(*) as count 
FROM tasks 
GROUP BY type; 
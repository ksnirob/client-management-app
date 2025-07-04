-- Migration: Add social_contacts column to clients table
-- Date: 2025-01-20

USE client_management_db;

-- Add social_contacts JSON column to clients table
ALTER TABLE clients 
ADD COLUMN social_contacts JSON AFTER country;

-- Optional: Add some sample social contacts data for existing clients
UPDATE clients 
SET social_contacts = JSON_OBJECT(
    'whatsapp', '+1234567890',
    'linkedin', 'company-profile',
    'website', 'www.example.com'
) 
WHERE id = 1 AND social_contacts IS NULL;

-- Show the updated table structure
DESCRIBE clients; 
-- Update existing project statuses from Dutch to English
-- Run this manually on your database if you have existing data

UPDATE "Project" 
SET status = 'New' 
WHERE status = 'Nieuw';

UPDATE "Project" 
SET status = 'In Progress' 
WHERE status = 'In Behandeling';

UPDATE "Project" 
SET status = 'Completed' 
WHERE status = 'Voltooid';

-- Verify the changes
SELECT status, COUNT(*) as count 
FROM "Project" 
GROUP BY status;

-- CreateEnum
-- Update Project status values from old format to new format
-- New status values: NEW, IN_PROGRESS, PREVIEW, COMPLETE

-- Step 1: Update existing projects to new status format
UPDATE "Project" 
SET status = 'NEW' 
WHERE status = 'New';

UPDATE "Project" 
SET status = 'IN_PROGRESS' 
WHERE status = 'In Progress';

UPDATE "Project" 
SET status = 'PREVIEW'
WHERE status = 'Completed' AND "paymentRequired" = true AND "paymentStatus" = 'Pending';

UPDATE "Project" 
SET status = 'COMPLETE' 
WHERE status = 'Completed';

UPDATE "Project"
SET status = 'IN_PROGRESS'
WHERE status IN ('Awaiting Payment', 'Paid', 'Rejected');

-- Step 2: Make paymentAlias required (NOT NULL)
-- First, generate aliases for any projects that don't have one
-- This is handled by the application code in lib/payment-alias.ts

-- Step 3: Update default status to NEW
-- This is handled by the Prisma schema change

/*
  Summary of changes:
  - Changed status values: "New" → "NEW", "In Progress" → "IN_PROGRESS", "Completed" → "COMPLETE"  
  - Added new status: "PREVIEW" (for projects awaiting payment after preview)
  - Made paymentAlias required (NOT NULL) - must be generated on project creation
  - Updated default status from "New" to "NEW"
  
  Status flow:
  1. NEW - Project created
  2. IN_PROGRESS - Admin working on it
  3. PREVIEW - Work done, awaiting payment
  4. COMPLETE - Payment received and verified
*/

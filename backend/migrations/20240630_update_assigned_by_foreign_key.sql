-- Migration to update the assigned_by foreign key in track_entries and customer_track_entries

-- Step 1: Drop the existing foreign key constraints
ALTER TABLE `track_entries` DROP FOREIGN KEY `track_entries_ibfk_3`;
ALTER TABLE `customer_track_entries` DROP FOREIGN KEY `customer_track_entries_ibfk_3`;

-- Step 2: Update the assigned_by column to reference the users table
-- This assumes that the employee_id in the users table correctly corresponds
-- to the employee_id that was previously stored in the assigned_by column.
-- A more complex data migration script would be needed if this is not the case.

-- Step 3: Add the new foreign key constraints referencing users(user_id)
ALTER TABLE `track_entries` ADD CONSTRAINT `fk_track_entries_assigned_by_user` 
FOREIGN KEY (`assigned_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT;

ALTER TABLE `customer_track_entries` ADD CONSTRAINT `fk_customer_track_entries_assigned_by_user` 
FOREIGN KEY (`assigned_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT;

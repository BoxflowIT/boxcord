-- Rename role STAFF → MEMBER
-- Updates existing users and changes the default value

-- Update all existing STAFF users to MEMBER
UPDATE "users" SET "role" = 'MEMBER' WHERE "role" = 'STAFF';

-- Change the default value for new users
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

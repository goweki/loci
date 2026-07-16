/*
  - Adds a column `[username]` on the table `users`, with unique constraint
*/

ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Populate 'username' for existing users: 
-- Extract the prefix before '@' and append a random 5-digit number (between 10000 and 99999)
UPDATE "users"
SET "username" = LOWER(split_part("email", '@', 1)) || floor(random() * 90000 + 10000)::integer
WHERE "username" IS NULL;

-- make required
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- make unique index
CREATE UNIQUE INDEX "User_username_key" ON "users"("username");
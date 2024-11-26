/* 
Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
We are working on making it available!

Meanwhile you can:
1. Check pk name in your database, by running
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'subscriptions'
AND constraint_type = 'PRIMARY KEY';
2. Uncomment code below and paste pk name manually

Hope to release this update as soon as possible
 */
ALTER TABLE "subscriptions"
DROP CONSTRAINT "subscriptions_pkey";

--> statement-breakpoint
ALTER TABLE "subscriptions" ADD PRIMARY KEY ("id");

--> statement-breakpoint
ALTER TABLE "subscriptions"
ALTER COLUMN "id"
SET
    NOT NULL;
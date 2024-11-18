import { date, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { profilesTable } from "./profilesTable";

export const statusEnum = pgEnum("status", ["active", "inactive"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profilesTable.userId, { onDelete: "cascade" })
    .notNull(),
  subscriptionId: text("subscription_id").notNull(),
  status: statusEnum("status").notNull().default("inactive"),
  lastPaymentDate: date("last_payment_date"),
});

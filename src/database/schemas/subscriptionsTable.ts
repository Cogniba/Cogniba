import { date, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { profilesTable } from "./profilesTable";

const statusEnum = pgEnum("status", ["active", "inactive"]);

export const subscriptionsTable = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profilesTable.userId, { onDelete: "cascade" })
    .notNull(),
  subscriptionId: uuid("subscription_id"),
  status: statusEnum("status").notNull(),
  lastPaymentDate: date("last_payment_date"),
});

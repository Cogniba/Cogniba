import { date, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { profilesTable } from "./profilesTable";
import { InferSelectModel } from "drizzle-orm";

export const statusEnum = pgEnum("status", ["active", "inactive"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  userId: uuid("user_id")
    .references(() => profilesTable.userId, { onDelete: "cascade" })
    .notNull(),
  subscriptionId: text("subscription_id").notNull(),
  status: statusEnum("status").notNull().default("inactive"),
  lastPaymentDate: date("last_payment_date"),
});

export type SubscriptionType = InferSelectModel<typeof profilesTable>;

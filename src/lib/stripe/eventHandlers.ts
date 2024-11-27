import { db } from "@/database/db";
import { subscriptionsTable } from "@/database/schemas/subscriptionsTable";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

type EventHandler = (event: Stripe.Event) => Promise<void>;

const eventHandlers: Record<string, EventHandler> = {
  "customer.subscription.created": async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const subscriptionId = subscription.id;

    if (userId && subscriptionId) {
      await db.insert(subscriptionsTable).values({
        userId,
        subscriptionId,
        status: subscription.status === "active" ? "active" : "inactive",
        lastPaymentDate: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
      });
    }
  },
  "customer.subscription.updated": async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    await db
      .update(subscriptionsTable)
      .set({
        status: subscription.status === "active" ? "active" : "inactive",
        lastPaymentDate: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
      })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
  },
  "customer.subscription.deleted": async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    await db
      .update(subscriptionsTable)
      .set({ status: "inactive" })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
  },
  "invoice.payment_succeeded": async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    await db
      .update(subscriptionsTable)
      .set({ lastPaymentDate: new Date(), status: "active" })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
  },
  "invoice.payment_failed": async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    await db
      .update(subscriptionsTable)
      .set({ status: "inactive" })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
  },
  "checkout.session.completed": async (event: Stripe.Event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const subscriptionId = session.subscription as string;

    if (userId && subscriptionId) {
      await db.insert(subscriptionsTable).values({
        userId,
        subscriptionId,
        status: "active",
        lastPaymentDate: new Date(),
      });
    }
  },
  "customer.subscription.trial_will_end": async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    // TODO
  },
  "invoice.payment_action_required": async (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    // TODO
  },
};

export default eventHandlers;

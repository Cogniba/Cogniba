import { db } from "@/database/db";
import { subscriptionsTable } from "@/database/schemas/subscriptionsTable";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

type EventHandler = (event: Stripe.Event) => void;

const eventHandlers: Record<string, EventHandler> = {
  "customer.subscription.created": (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const subscriptionId = subscription.id;

    if (userId && subscriptionId) {
      db.insert(subscriptionsTable).values({
        userId,
        subscriptionId,
        status: subscription.status === "active" ? "active" : "inactive",
        lastPaymentDate: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
      });

      console.log(`Subscription created for user: ${userId}`);
    }
  },
  "customer.subscription.updated": (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    db.update(subscriptionsTable)
      .set({
        status: subscription.status === "active" ? "active" : "inactive",
        lastPaymentDate: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
      })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));

    console.log(`Subscription updated: ${subscriptionId}`);
  },
  "customer.subscription.deleted": (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    db.update(subscriptionsTable)
      .set({ status: "inactive" })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));

    console.log(`Subscription deleted: ${subscriptionId}`);
  },
  "invoice.payment_succeeded": (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    db.update(subscriptionsTable)
      .set({ lastPaymentDate: new Date(), status: "active" })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));

    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
  },
  "invoice.payment_failed": (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    db.update(subscriptionsTable)
      .set({ status: "inactive" })
      .where(eq(subscriptionsTable.subscriptionId, subscriptionId));

    console.log(`Payment failed for subscription: ${subscriptionId}`);
  },
  "checkout.session.completed": (event: Stripe.Event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const subscriptionId = session.subscription as string;

    if (userId && subscriptionId) {
      db.insert(subscriptionsTable).values({
        userId,
        subscriptionId,
        status: "active",
        lastPaymentDate: new Date(),
      });

      console.log(`Checkout session completed for user: ${userId}`);
    }
  },
  "customer.subscription.trial_will_end": (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    // TODO
    console.log(`Trial ending soon for user: ${userId}`);
  },
  "invoice.payment_action_required": (event: Stripe.Event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    // TODO
    console.log(`Payment action required for subscription: ${subscriptionId}`);
  },
};

export default eventHandlers;

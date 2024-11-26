import { db } from "@/database/db";
import { subscriptionsTable } from "@/database/schemas/subscriptionsTable";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { type Stripe } from "stripe";

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await (await request.blob()).text(),
      request.headers.get("stripe-signature") as string,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(error);

    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // TODO
  try {
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const subscriptionId = subscription.id;

      if (userId && subscriptionId) {
        await db.insert(subscriptionsTable).values({
          userId,
          subscriptionId,
          status: subscription.status,
          lastPaymentDate: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
        });
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      await db
        .update(subscriptionsTable)
        .set({
          status: subscription.status,
          lastPaymentDate: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
        })
        .where(subscriptionsTable.subscriptionId.eq(subscriptionId));
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      await db
        .update(subscriptionsTable)
        .set({ status: "inactive" })
        .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      await db
        .update(subscriptionsTable)
        .set({ lastPaymentDate: new Date(), status: "active" })
        .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      await db
        .update(subscriptionsTable)
        .set({ status: "inactive" })
        .where(eq(subscriptionsTable.subscriptionId, subscriptionId));
    } else if (event.type === "checkout.session.completed") {
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
    } else if (event.type === "customer.subscription.trial_will_end") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      // TODO
    } else if (event.type === "invoice.payment_action_required") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      // TODO
    } else {
      // TODO
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

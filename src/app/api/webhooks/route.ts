import { stripe } from "@/lib/stripe";
import eventHandlers from "@/lib/stripe/eventHandlers";
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

  const handler = eventHandlers[event.type];
  if (!handler) {
    console.warn(`Unhandled event type: ${event.type}`);
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  try {
    await handler(event);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

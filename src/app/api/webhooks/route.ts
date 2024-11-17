import { stripe } from "@/lib/stripe";
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
  if (event.type === "checkout.session.completed") {
  } else if (event.type === "payment_intent.succeeded") {
  } else if (event.type === "payment_intent.payment_failed") {
  } else {
  }
}

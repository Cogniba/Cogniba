import { CURRENCY, PRO_PLAN_PRICE } from "@/config/stripe";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const origin: string = request.headers.get("origin") as string;

    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: CURRENCY,
              unit_amount: PRO_PLAN_PRICE * 100,
              recurring: { interval: "month" },
              product_data: {
                name: "Pro Plan",
              },
            },
          },
        ],
        // TODO
        success_url: `${origin}/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/result?session_id={CHECKOUT_SESSION_ID}`,
      });

    return NextResponse.json(
      { clientSecret: checkoutSession.client_secret, url: checkoutSession.url },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

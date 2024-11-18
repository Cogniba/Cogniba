import { CURRENCY, PRO_PLAN_PRICE } from "@/config/stripe";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 400 },
      );
    }

    const userId = data.user.id;

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
        metadata: { userId },
        success_url: `${origin}/TODO?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/TODO`,
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

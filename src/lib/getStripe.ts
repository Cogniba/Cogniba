import { Stripe, loadStripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

const publishableKey =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY;

export default function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey!);
  }
  return stripePromise;
}

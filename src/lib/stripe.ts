import "server-only";

import { Stripe } from "stripe";

const secretKey =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY;

export const stripe = new Stripe(secretKey!, {
  apiVersion: "2024-10-28.acacia",
  appInfo: {
    name: "Cogniba",
    url: "https://www.cogniba.com",
  },
});

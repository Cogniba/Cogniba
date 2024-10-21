"use client";

import { createBrowserClient } from "@supabase/ssr";

export default function createClient() {
  // return createBrowserClient<Database>(
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

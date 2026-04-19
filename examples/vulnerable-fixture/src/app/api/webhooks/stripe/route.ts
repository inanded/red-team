import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Intentionally vulnerable: the handler processes every event without
// recording event.id for idempotency. Stripe retries deliveries on transient
// failures, so side effects (entitlement changes, credit grants, emails) run
// multiple times.
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from("subscriptions").upsert({
      id: sub.id,
      org_id: sub.metadata.org_id,
      status: sub.status as "active" | "trialing" | "canceled" | "incomplete",
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}

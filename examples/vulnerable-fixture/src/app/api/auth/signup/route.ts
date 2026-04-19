import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Intentionally vulnerable: the response distinguishes an already-registered
// email from a new email. A caller can enumerate valid accounts by comparing
// the 409 response to the 200 response.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "email already registered" }, { status: 409 });
  }
  await supabase.auth.admin.createUser({ email, password });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Intentionally vulnerable: the v1 route is kept around for backwards
// compatibility with an older mobile client. It reads user_id from the query
// string rather than the session. The v2 equivalent under /api/users/me
// requires an authenticated session.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return NextResponse.json(data);
}

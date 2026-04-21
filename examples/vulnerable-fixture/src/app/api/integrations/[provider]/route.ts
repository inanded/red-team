import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function logAudit(action: string, provider: string, actor: string) {
  await supabase.from("audit_log").insert({
    action,
    provider,
    actor,
    at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest, { params }: { params: { provider: string } }) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("integrations")
    .insert({ provider: params.provider, config: body.config, owner: body.actor })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAudit("integration.added", params.provider, body.actor);
  return NextResponse.json(data);
}

// Intentionally vulnerable: DELETE removes the third-party integration (which
// may be the only record of the trust decision and any OAuth scopes granted to
// it) without emitting an audit-log entry. The peer POST handler above does
// log. An insider can therefore quietly detach a compromised integration to
// remove forensic evidence.
export async function DELETE(req: NextRequest, { params }: { params: { provider: string } }) {
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("provider", params.provider);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

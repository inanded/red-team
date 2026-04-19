import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Intentionally vulnerable: two defects in one handler.
// (1) The model identifier is taken from the request body with no allow-list,
//     allowing a caller to route completions to any model the API key can
//     access, including expensive or unreviewed ones.
// (2) Usage enforcement reads the counter, compares in JavaScript, and writes
//     back. Concurrent requests race between the read and the write and both
//     pass the cap.
export async function POST(req: NextRequest) {
  const { prompt, model, userId } = await req.json();

  const month = new Date().toISOString().slice(0, 7);
  const { data: counter } = await supabase
    .from("usage_counters")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if ((counter?.count ?? 0) >= 100) {
    return NextResponse.json({ error: "quota exceeded" }, { status: 429 });
  }

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  await supabase.from("usage_counters").upsert({
    user_id: userId,
    month,
    count: (counter?.count ?? 0) + 1,
  });

  return NextResponse.json({ text: completion.choices[0].message.content });
}

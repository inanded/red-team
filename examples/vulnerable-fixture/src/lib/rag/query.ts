import OpenAI from "openai";

const openai = new OpenAI();

type Chunk = { text: string; source: string };

// Intentionally vulnerable: chunks retrieved from a user-uploaded document
// index are concatenated directly into the prompt with no source marking.
// A chunk that contains instructions is treated as authoritative by the model.
// The fix is to wrap each chunk in a delimiter labelled with the source type
// and to reject chunks whose source is "user-uploaded" for system-level
// reasoning.
export async function answerWithContext(question: string, chunks: Chunk[]): Promise<string> {
  const context = chunks.map((c) => c.text).join("\n\n");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant. Use the context to answer." },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
  });
  return completion.choices[0].message.content ?? "";
}

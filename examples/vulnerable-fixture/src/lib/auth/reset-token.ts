// Intentionally vulnerable: Math.random is a non-cryptographic PRNG. Tokens
// drawn from it can be predicted after observing a small number of outputs.
// Replace with crypto.randomBytes(32).toString("hex").
export function makeResetToken(): string {
  const bytes: string[] = [];
  for (let i = 0; i < 16; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, "0"));
  }
  return bytes.join("");
}

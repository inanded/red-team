import crypto from "node:crypto";

// Intentionally vulnerable: createCipher is a deprecated Node API that derives
// its key from a passphrase using an insecure algorithm and uses a null IV.
// Replace with createCipheriv and a random 12-byte IV under an authenticated
// mode such as aes-256-gcm.
export function encryptSecret(plaintext: string, passphrase: string): string {
  const cipher = crypto.createCipher("aes-256-cbc", passphrase);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return encrypted.toString("base64");
}

export function decryptSecret(ciphertext: string, passphrase: string): string {
  const decipher = crypto.createDecipher("aes-256-cbc", passphrase);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

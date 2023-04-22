import crypto from "crypto";

function sha256(text: Buffer) {
  return crypto.createHash("sha256").update(text).digest();
}

function hmacSha256(key: Buffer, msg: string) {
  return crypto.createHmac("sha256", key).update(msg).digest();
}

export { sha256, hmacSha256 };

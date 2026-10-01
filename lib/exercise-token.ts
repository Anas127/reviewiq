import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export type ExerciseBug = {
  id: number;
  line: string;
  description: string;
};

export type Exercise = {
  userId: string;
  code: string;
  bugs: ExerciseBug[];
  role: string;
  language: string;
  seniority: string;
};

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

function getEncryptionKey() {
  const secret = process.env.EXERCISE_TOKEN_SECRET;
  if (!secret) throw new Error("EXERCISE_TOKEN_SECRET is not configured");
  return createHash("sha256").update(secret).digest();
}

export function sealExercise(exercise: Exercise) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const payload = Buffer.from(
    JSON.stringify({ ...exercise, expiresAt: Date.now() + TOKEN_LIFETIME_MS }),
  );
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function openExercise(token: string, userId: string): Exercise | null {
  try {
    const sealed = Buffer.from(token, "base64url");
    if (sealed.length <= 28) return null;

    const iv = sealed.subarray(0, 12);
    const tag = sealed.subarray(12, 28);
    const ciphertext = sealed.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    const payload = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(payload) as Exercise & { expiresAt: number };

    if (
      parsed.userId !== userId ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt < Date.now() ||
      typeof parsed.code !== "string" ||
      !Array.isArray(parsed.bugs)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

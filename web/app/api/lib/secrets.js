// Secrets loader.
// Real values live in .env.local (gitignored). This file only reads them.
// In dev a fallback is used so the app boots without configuration —
// in production you MUST set JWT_TOKEN.

const FALLBACK = "dev-only-jwt-do-not-use-in-prod";

if (!process.env.JWT_TOKEN && process.env.NODE_ENV === "production") {
  throw new Error("JWT_TOKEN env var is required in production");
}

export const JWT_TOKEN = process.env.JWT_TOKEN || FALLBACK;

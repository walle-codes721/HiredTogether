export interface Env {
  DB: D1Database;
}

export function uid(): string {
  return crypto.randomUUID();
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

const ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return `${ITERATIONS}:${toHex(salt)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterStr, saltHex, hashHex] = stored.split(":");
  const iterations = parseInt(iterStr, 10);
  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return toHex(bits) === hashHex;
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export const clearSessionCookie = "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  title: string;
}

export async function requireUser(request: Request, env: Env): Promise<AuthedUser | null> {
  const token = getCookie(request, "session");
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.title FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  )
    .bind(token)
    .first<AuthedUser>();
  return row ?? null;
}

export function inviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

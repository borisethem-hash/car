import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDb } from "./db";
import type { SessionUser, Vehicle } from "./types";

// ログイン状態は、改ざん防止の署名付き Cookie で管理します。
// 本番環境では .env.local に SESSION_SECRET（長いランダムな文字列）を必ず設定してください。

const COOKIE_NAME = "vms_session";
const SESSION_HOURS = 8;
const SECRET = process.env.SESSION_SECRET || "demo-secret-please-change-in-production-0123456789";

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_HOURS * 3600 * 1000 })).toString("base64url");
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid: string; exp: number };
    if (data.exp < Date.now()) return null;
    const user = readDb().users.find((u) => u.id === data.uid && u.active);
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  } catch {
    return null;
  }
}

/** ログイン必須のページで使用。未ログインならログイン画面へ */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 管理者専用ページで使用。一般ユーザーはトップへ */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

/** この利用者が閲覧できる車両か（一般ユーザーは自分の事業部のみ） */
export function canAccessVehicle(user: SessionUser, vehicle: Vehicle): boolean {
  return user.role === "admin" || vehicle.divisionId === user.divisionId;
}

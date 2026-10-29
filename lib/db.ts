import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createSeedData } from "./seed";
import type { Database } from "./types";

// データの保存先は、動かす環境に合わせて自動で切り替わります。
//
//  1. デモモード（Vercel にそのまま公開した場合）
//     データベースもファイルも使わず、サーバーのメモリ上でデモデータを動かします。
//     設定不要ですべての機能を試せますが、変更内容は一定時間がたつと初期状態に戻ります。
//     環境変数 DEMO_MODE=true を設定すると、どの環境でもこのモードになります。
//  2. Upstash Redis（Vercel などのクラウドで本番運用する場合・任意）
//     環境変数 KV_REST_API_URL / KV_REST_API_TOKEN
//     （または UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN）が設定されていれば使用します。
//  3. data/db.json（社内PC・VPS などで動かす場合）
//     バックアップはこのファイルをコピーするだけで完了します。
//
// どの保存先でも、データが無い場合は初回アクセス時にデモデータが自動で作成されます。

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const REDIS_KEY = process.env.DB_KEY || "vehicle-management:db";

export type StorageMode = "memory" | "redis" | "file";

export function storageMode(): StorageMode {
  if (process.env.DEMO_MODE === "true") return "memory";
  if (REDIS_URL && REDIS_TOKEN) return "redis";
  if (process.env.VERCEL) return "memory";
  return "file";
}

// ───────── メモリ（デモモード） ─────────
// ページ・API ごとにプログラムが分かれていても同じデータを共有できるよう、
// サーバー全体で1つの置き場（globalThis）に保存します。

const memory = globalThis as typeof globalThis & { __vehicleDb?: Database };

// ───────── Upstash Redis（REST API） ─────────

async function redis(command: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
  if (!res.ok || data.error) throw new Error(`Redis への接続に失敗しました: ${data.error ?? res.status}`);
  return data.result;
}

// ───────── ファイル ─────────

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function readFile(): Database | null {
  if (!fs.existsSync(DB_FILE)) return null;
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
}

function writeFile(db: Database): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  const json = JSON.stringify(db, null, 2);
  // 一時ファイルに書いてから置き換えることで、書き込み途中の破損を防ぎます
  fs.writeFileSync(tmp, json, "utf8");
  try {
    fs.renameSync(tmp, DB_FILE);
  } catch {
    fs.writeFileSync(DB_FILE, json, "utf8");
    fs.rmSync(tmp, { force: true });
  }
}

// ───────── 共通の読み書き ─────────

export async function readDb(): Promise<Database> {
  const mode = storageMode();
  let db: Database | null;
  if (mode === "memory") {
    // 呼び出し側の変更が保存前に混ざらないよう、コピーを渡します
    db = memory.__vehicleDb ? structuredClone(memory.__vehicleDb) : null;
  } else if (mode === "redis") {
    const raw = await redis(["GET", REDIS_KEY]);
    db = typeof raw === "string" ? (JSON.parse(raw) as Database) : null;
  } else {
    db = readFile();
  }
  if (!db) {
    db = createSeedData();
    await writeDb(db);
  }
  return db;
}

export async function writeDb(db: Database): Promise<void> {
  const mode = storageMode();
  if (mode === "memory") {
    memory.__vehicleDb = structuredClone(db);
  } else if (mode === "redis") {
    await redis(["SET", REDIS_KEY, JSON.stringify(db)]);
  } else {
    writeFile(db);
  }
}

export async function updateDb<T>(fn: (db: Database) => T): Promise<T> {
  const db = await readDb();
  const result = fn(db);
  await writeDb(db);
  return result;
}

export async function resetDb(): Promise<void> {
  await writeDb(createSeedData());
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

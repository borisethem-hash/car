import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createSeedData } from "./seed";
import type { Database } from "./types";

// データは data/db.json に保存されます。
// ファイルが無い場合は、初回アクセス時にデモデータが自動で作成されます。
// バックアップはこのファイルをコピーするだけで完了します。

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export function readDb(): Database {
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedData();
    writeDb(seed);
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
}

export function writeDb(db: Database): void {
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

export function updateDb<T>(fn: (db: Database) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

export function resetDb(): void {
  writeDb(createSeedData());
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

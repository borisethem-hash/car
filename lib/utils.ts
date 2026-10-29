// 日付・金額・年度などの共通処理

/** 今日の日付を YYYY-MM-DD で返す（日本時間） */
export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/** YYYY-MM-DD 同士の日数差（b - a） */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  return Math.round(ms / 86400000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addYears(date: string, years: number): string {
  const [y, m, d] = date.split("-").map(Number);
  // 2/29 → 2/28 に丸める
  const last = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  return `${y + years}-${String(m).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function formatDate(date: string): string {
  if (!date) return "-";
  const [y, m, d] = date.split("-");
  return d ? `${y}/${m}/${d}` : `${y}/${m}`;
}

export function yen(n: number): string {
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}

export function km(n: number): string {
  return n.toLocaleString("ja-JP") + " km";
}

/** 年度（4月始まり）。2026-10-29 → 2026 */
export function fiscalYearOf(date: string): number {
  const [y, m] = date.split("-").map(Number);
  return m >= 4 ? y : y - 1;
}

export function fiscalYearRange(fy: number): { start: string; end: string } {
  return { start: `${fy}-04-01`, end: `${fy + 1}-03-31` };
}

/** 増減率の表示用文字列 */
export function changeRate(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "±0%" : "前期なし";
  const r = ((current - previous) / previous) * 100;
  const sign = r > 0 ? "+" : r < 0 ? "" : "±";
  return `${sign}${r.toFixed(1)}%`;
}

export type InspectionLevel = "expired" | "within30" | "within60" | "ok";

export function inspectionLevel(expiry: string, today = todayStr()): InspectionLevel {
  const days = daysBetween(today, expiry);
  if (days < 0) return "expired";
  if (days <= 30) return "within30";
  if (days <= 60) return "within60";
  return "ok";
}

export function inspectionLabel(expiry: string, today = todayStr()): string {
  const days = daysBetween(today, expiry);
  if (days < 0) return `${-days}日超過`;
  if (days === 0) return "本日まで";
  return `あと${days}日`;
}

/** URL の検索パラメータを文字列として取り出す */
export function param(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

/** 戻り先URLとして安全なサイト内パスのみ許可 */
export function safePath(v: string, fallback: string): string {
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}

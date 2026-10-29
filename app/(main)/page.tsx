import Link from "next/link";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { Card, EmptyState, InspectionBadge, StatCard, td, th } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { lookup } from "@/lib/queries";
import { addYears, changeRate, daysBetween, fiscalYearOf, formatDate, todayStr, yen } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireUser();
  const db = await readDb();
  const L = lookup(db);
  const today = todayStr();

  const vehicles = db.vehicles.filter((v) => user.role === "admin" || v.divisionId === user.divisionId);
  const vehicleIds = new Set(vehicles.map((v) => v.id));
  const repairs = db.repairs.filter((r) => vehicleIds.has(r.vehicleId));
  const active = vehicles.filter((v) => v.status !== "廃車");

  const expired = active.filter((v) => daysBetween(today, v.inspectionExpiry) < 0);
  const within30 = active.filter((v) => {
    const d = daysBetween(today, v.inspectionExpiry);
    return d >= 0 && d <= 30;
  });
  const alerts = active
    .filter((v) => daysBetween(today, v.inspectionExpiry) <= 60)
    .sort((a, b) => a.inspectionExpiry.localeCompare(b.inspectionExpiry));

  // 今期（4月〜今日）と前期の同じ期間の比較
  const fy = fiscalYearOf(today);
  const curStart = `${fy}-04-01`;
  const prevStart = `${fy - 1}-04-01`;
  const prevEnd = addYears(today, -1);
  const curCost = repairs.filter((r) => r.date >= curStart && r.date <= today).reduce((s, r) => s + r.cost, 0);
  const prevCost = repairs.filter((r) => r.date >= prevStart && r.date <= prevEnd).reduce((s, r) => s + r.cost, 0);
  const recent = repairs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tokyo" }));
  const greeting = hour < 11 ? "おはようございます" : hour < 18 ? "こんにちは" : "おつかれさまです";

  return (
    <div>
      <div className="mx-auto mb-10 max-w-2xl pt-2 text-center md:pt-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting}、{user.name.split(" ").slice(-1)[0]}さん
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{user.role === "admin" ? "全事業部" : L.division(user.divisionId)}の車両状況をお知らせします</p>
        <form action="/vehicles" method="get" className="relative mt-6">
          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            placeholder="ナンバー・車名・担当者で車両を探す（例：品川、ハイエース）"
            className="w-full rounded-full border border-[var(--border)] bg-white py-4 pl-13 pr-24 text-[15px] shadow-sm outline-none transition focus:border-neutral-400 focus:shadow-md"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700">
            検索
          </button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/repairs/new" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-2 text-sm hover:bg-neutral-50">
            <PlusIcon className="size-4" />
            修理・整備を登録
          </Link>
          <Link href="/vehicles?inspection=60" className="rounded-full border border-[var(--border)] px-3.5 py-2 text-sm hover:bg-neutral-50">
            車検が近い車両
          </Link>
          <Link href="/reports" className="rounded-full border border-[var(--border)] px-3.5 py-2 text-sm hover:bg-neutral-50">
            修理費用を見る
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="稼働車両（廃車を除く）" value={`${active.length}台`} sub={`登録台数 ${vehicles.length}台`} href="/vehicles?status=active-all" />
        <StatCard label="車検 期限切れ" value={`${expired.length}台`} tone={expired.length ? "danger" : "default"} sub="至急対応が必要です" href="/vehicles?inspection=expired" />
        <StatCard label="車検 30日以内" value={`${within30.length}台`} tone={within30.length ? "warning" : "default"} sub="予約・手配をしましょう" href="/vehicles?inspection=30" />
        <StatCard label={`${fy}年度 修理費用（累計）`} value={yen(curCost)} sub={`前年同期 ${yen(prevCost)}（${changeRate(curCost, prevCost)}）`} href="/reports" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="車検期限アラート（60日以内）" actions={<Link href="/vehicles?inspection=60" className="text-sm text-[var(--muted)] hover:text-neutral-900">すべて見る</Link>}>
          {alerts.length === 0 ? (
            <EmptyState>60日以内に車検期限を迎える車両はありません</EmptyState>
          ) : (
            <ul className="-my-2 divide-y divide-neutral-100">
              {alerts.slice(0, 8).map((v) => (
                <li key={v.id}>
                  <Link href={`/vehicles/${v.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-neutral-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{v.plateNumber}</div>
                      <div className="truncate text-xs text-[var(--muted)]">
                        {v.maker} {v.model}・{L.division(v.divisionId)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <InspectionBadge expiry={v.inspectionExpiry} />
                      <div className="tabular mt-1 text-xs text-[var(--muted)]">{formatDate(v.inspectionExpiry)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="最近の修理・整備" actions={<Link href="/repairs" className="text-sm text-[var(--muted)] hover:text-neutral-900">すべて見る</Link>}>
          {recent.length === 0 ? (
            <EmptyState>まだ修理・整備の記録はありません</EmptyState>
          ) : (
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>実施日</th>
                    <th className={th}>車両</th>
                    <th className={th}>内容</th>
                    <th className={th + " text-right"}>費用</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => {
                    const v = L.vehicle(r.vehicleId);
                    return (
                      <tr key={r.id} className="hover:bg-neutral-50">
                        <td className={td + " tabular text-[var(--muted)]"}>{formatDate(r.date)}</td>
                        <td className={td}>
                          <Link href={`/vehicles/${r.vehicleId}`} className="hover:underline">
                            {v?.plateNumber}
                          </Link>
                        </td>
                        <td className={td}>
                          {r.type}・{L.part(r.partId)}
                        </td>
                        <td className={td + " tabular text-right"}>{yen(r.cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Card, EmptyState, inputClass, PageHeader, StatCard, TableWrap, td, th } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { lookup } from "@/lib/queries";
import type { Repair } from "@/lib/types";
import { addYears, changeRate, fiscalYearOf, fiscalYearRange, formatDate, param, todayStr, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "費用集計" };

type Row = { key: string; name: string; cur: number; prev: number; curCount: number };

function aggregate(cur: Repair[], prev: Repair[], keyOf: (r: Repair) => string, nameOf: (k: string) => string): Row[] {
  const map = new Map<string, Row>();
  const get = (k: string) => {
    let row = map.get(k);
    if (!row) {
      row = { key: k, name: nameOf(k), cur: 0, prev: 0, curCount: 0 };
      map.set(k, row);
    }
    return row;
  };
  for (const r of cur) {
    const row = get(keyOf(r));
    row.cur += r.cost;
    row.curCount++;
  }
  for (const r of prev) get(keyOf(r)).prev += r.cost;
  return [...map.values()].sort((a, b) => b.cur - a.cur || b.prev - a.prev);
}

function ChangeCell({ cur, prev }: { cur: number; prev: number }) {
  const diff = cur - prev;
  const color = diff > 0 ? "text-red-600" : diff < 0 ? "text-emerald-700" : "text-[var(--muted)]";
  return (
    <>
      <td className={`${td} tabular text-right ${color}`}>
        {diff > 0 ? "+" : diff < 0 ? "−" : ""}
        {yen(Math.abs(diff))}
      </td>
      <td className={`${td} tabular text-right ${color}`}>{changeRate(cur, prev)}</td>
    </>
  );
}

function CompareTable({ title, rows, curLabel, prevLabel }: { title: string; rows: Row[]; curLabel: string; prevLabel: string }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.cur, r.prev)));
  const totalCur = rows.reduce((s, r) => s + r.cur, 0);
  const totalPrev = rows.reduce((s, r) => s + r.prev, 0);
  return (
    <div>
      <h2 className="mb-3 text-[15px] font-semibold">{title}</h2>
      <TableWrap>
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>項目</th>
              <th className={th + " min-w-[160px]"}>比較グラフ</th>
              <th className={th + " text-right"}>{curLabel}</th>
              <th className={th + " text-right"}>{prevLabel}</th>
              <th className={th + " text-right"}>増減額</th>
              <th className={th + " text-right"}>増減率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-neutral-50">
                <td className={td}>
                  {r.name}
                  <span className="ml-1.5 text-xs text-[var(--muted)]">{r.curCount}件</span>
                </td>
                <td className={td}>
                  <div className="space-y-[2px]" title={`${curLabel} ${yen(r.cur)} ／ ${prevLabel} ${yen(r.prev)}`}>
                    <div className="h-2 rounded-r-[4px] bg-[var(--series-current)]" style={{ width: `${(r.cur / max) * 100}%` }} />
                    <div className="h-2 rounded-r-[4px] bg-[var(--series-previous)]" style={{ width: `${(r.prev / max) * 100}%` }} />
                  </div>
                </td>
                <td className={td + " tabular text-right font-medium"}>{yen(r.cur)}</td>
                <td className={td + " tabular text-right text-[var(--muted)]"}>{yen(r.prev)}</td>
                <ChangeCell cur={r.cur} prev={r.prev} />
              </tr>
            ))}
            <tr className="bg-neutral-50 font-semibold">
              <td className={td}>合計</td>
              <td className={td}></td>
              <td className={td + " tabular text-right"}>{yen(totalCur)}</td>
              <td className={td + " tabular text-right"}>{yen(totalPrev)}</td>
              <ChangeCell cur={totalCur} prev={totalPrev} />
            </tr>
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

function Legend({ curLabel, prevLabel }: { curLabel: string; prevLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-sm bg-[var(--series-current)]" />
        {curLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-sm bg-[var(--series-previous)]" />
        {prevLabel}
      </span>
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = readDb();
  const L = lookup(db);
  const isAdmin = user.role === "admin";
  const today = todayStr();

  const currentFy = fiscalYearOf(today);
  const oldest = db.repairs.reduce((min, r) => (r.date < min ? r.date : min), today);
  const fyOptions: number[] = [];
  for (let y = currentFy; y >= fiscalYearOf(oldest); y--) fyOptions.push(y);

  const fy = fyOptions.includes(Number(param(sp.fy))) ? Number(param(sp.fy)) : currentFy;
  const basis = param(sp.basis) === "full" ? "full" : "same";
  const division = isAdmin ? param(sp.division) : user.divisionId ?? "";

  const cur = fiscalYearRange(fy);
  const prev = fiscalYearRange(fy - 1);
  const isOngoing = fy === currentFy;
  // 「同期間比較」：今期が途中の場合、前期も同じ日付までで比較
  const curEnd = isOngoing ? today : cur.end;
  const prevEnd = basis === "same" && isOngoing ? addYears(today, -1) : prev.end;

  const vehicleMap = new Map(db.vehicles.map((v) => [v.id, v]));
  const scoped = db.repairs.filter((r) => {
    const v = vehicleMap.get(r.vehicleId);
    if (!v) return false;
    if (!isAdmin && v.divisionId !== user.divisionId) return false;
    return !division || v.divisionId === division;
  });
  const curRepairs = scoped.filter((r) => r.date >= cur.start && r.date <= curEnd);
  const prevRepairs = scoped.filter((r) => r.date >= prev.start && r.date <= prevEnd);
  const prevFullRepairs = scoped.filter((r) => r.date >= prev.start && r.date <= prev.end);

  const sum = (list: Repair[]) => list.reduce((s, r) => s + r.cost, 0);
  const curTotal = sum(curRepairs);
  const prevTotal = sum(prevRepairs);
  const curLabel = `${fy}年度`;
  const prevLabel = `${fy - 1}年度`;
  const periodNote = `${formatDate(cur.start)}〜${formatDate(curEnd)} と ${formatDate(prev.start)}〜${formatDate(prevEnd)} を比較`;

  // 月別推移（4月〜3月）
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = ((i + 3) % 12) + 1;
    const yCur = m >= 4 ? fy : fy + 1;
    const keyCur = `${yCur}-${String(m).padStart(2, "0")}`;
    const keyPrev = `${yCur - 1}-${String(m).padStart(2, "0")}`;
    return {
      label: `${m}月`,
      cur: sum(scoped.filter((r) => r.date.startsWith(keyCur))),
      prev: sum(scoped.filter((r) => r.date.startsWith(keyPrev))),
      future: keyCur > today.slice(0, 7),
    };
  });
  const monthMax = Math.max(1, ...months.map((m) => Math.max(m.cur, m.prev)));

  const byDivision = aggregate(curRepairs, prevRepairs, (r) => vehicleMap.get(r.vehicleId)?.divisionId ?? "", (k) => L.division(k));
  const byCategory = aggregate(curRepairs, prevRepairs, (r) => vehicleMap.get(r.vehicleId)?.categoryId ?? "", (k) => L.category(k));
  const byPart = aggregate(curRepairs, prevRepairs, (r) => r.partId, (k) => L.part(k));
  const byVendor = aggregate(curRepairs, prevRepairs, (r) => r.vendorId, (k) => L.vendor(k));
  const topVehicles = aggregate(curRepairs, [], (r) => r.vehicleId, (k) => vehicleMap.get(k)?.plateNumber ?? "-").slice(0, 10);

  const selectCls = inputClass + " py-2 text-sm";

  return (
    <div>
      <PageHeader title="修理費用の集計" description="年度（4月〜翌3月）ごとの修理費用を、前期（前の年度）と比較できます" />

      <AutoSubmitForm className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select name="fy" defaultValue={String(fy)} className={selectCls} aria-label="年度">
          {fyOptions.map((y) => (
            <option key={y} value={y}>
              {y}年度（{y}年4月〜{y + 1}年3月）
            </option>
          ))}
        </select>
        {isAdmin ? (
          <select name="division" defaultValue={division} className={selectCls} aria-label="事業部">
            <option value="">すべての事業部</option>
            {db.divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        ) : (
          <div className={selectCls + " bg-neutral-50 text-[var(--muted)]"}>{L.division(user.divisionId)}</div>
        )}
        <select name="basis" defaultValue={basis} className={selectCls} aria-label="比較方法" disabled={!isOngoing}>
          <option value="same">前期の同じ期間と比較</option>
          <option value="full">前期の1年間と比較</option>
        </select>
      </AutoSubmitForm>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`${curLabel}${isOngoing ? "（今日まで）" : ""}`} value={yen(curTotal)} sub={`${curRepairs.length}件`} />
        <StatCard label={`${prevLabel}${basis === "same" && isOngoing ? "（同期間）" : "（通年）"}`} value={yen(prevTotal)} sub={`${prevRepairs.length}件`} />
        <StatCard label="増減額" value={`${curTotal - prevTotal >= 0 ? "+" : "−"}${yen(Math.abs(curTotal - prevTotal))}`} tone={curTotal > prevTotal ? "danger" : "default"} sub={`増減率 ${changeRate(curTotal, prevTotal)}`} />
        <StatCard label={`${prevLabel} 通年の合計`} value={yen(sum(prevFullRepairs))} sub={`${prevFullRepairs.length}件`} />
      </div>
      <p className="-mt-3 mb-6 text-xs text-[var(--muted)]">{periodNote}</p>

      <Card title="月別の推移" actions={<Legend curLabel={curLabel} prevLabel={prevLabel} />} className="mb-8">
        <div className="mb-2 text-right text-xs text-[var(--muted)]">最大 {yen(monthMax)}</div>
        <div className="flex h-56 items-end gap-1 border-b border-[var(--border)] sm:gap-2">
          {months.map((m) => (
            <div key={m.label} className="group relative flex h-full flex-1 items-end justify-center gap-[2px]">
              <div className="w-1/2 max-w-5 rounded-t-[4px] bg-[var(--series-current)]" style={{ height: `${(m.cur / monthMax) * 100}%` }} />
              <div className="w-1/2 max-w-5 rounded-t-[4px] bg-[var(--series-previous)]" style={{ height: `${(m.prev / monthMax) * 100}%` }} />
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-white shadow group-hover:block">
                <div className="font-medium">{m.label}</div>
                <div className="tabular">
                  {curLabel}：{m.future ? "（未経過）" : yen(m.cur)}
                </div>
                <div className="tabular">
                  {prevLabel}：{yen(m.prev)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1 sm:gap-2">
          {months.map((m) => (
            <div key={m.label} className="flex-1 text-center text-[11px] text-[var(--muted)]">
              {m.label}
            </div>
          ))}
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-[var(--muted)] hover:text-neutral-900">数値の表を表示</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>月</th>
                  <th className={th + " text-right"}>{curLabel}</th>
                  <th className={th + " text-right"}>{prevLabel}</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.label}>
                    <td className={td}>{m.label}</td>
                    <td className={td + " tabular text-right"}>{m.future ? "-" : yen(m.cur)}</td>
                    <td className={td + " tabular text-right"}>{yen(m.prev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>

      {curRepairs.length === 0 && prevRepairs.length === 0 ? (
        <EmptyState>この条件では修理費用のデータがありません。</EmptyState>
      ) : (
        <div className="space-y-8">
          {isAdmin && !division && <CompareTable title="事業部別" rows={byDivision} curLabel={curLabel} prevLabel={prevLabel} />}
          <CompareTable title="車両区分別" rows={byCategory} curLabel={curLabel} prevLabel={prevLabel} />
          <CompareTable title="修理箇所別" rows={byPart} curLabel={curLabel} prevLabel={prevLabel} />
          <CompareTable title="修理業者別" rows={byVendor} curLabel={curLabel} prevLabel={prevLabel} />

          <div>
            <h2 className="mb-3 text-[15px] font-semibold">修理費用が多い車両（{curLabel} 上位10台）</h2>
            <TableWrap>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>順位</th>
                    <th className={th}>登録番号</th>
                    <th className={th}>車名</th>
                    <th className={th}>事業部</th>
                    <th className={th + " text-right"}>件数</th>
                    <th className={th + " text-right"}>費用合計</th>
                  </tr>
                </thead>
                <tbody>
                  {topVehicles.map((r, i) => {
                    const v = vehicleMap.get(r.key);
                    return (
                      <tr key={r.key} className="hover:bg-neutral-50">
                        <td className={td + " tabular text-[var(--muted)]"}>{i + 1}</td>
                        <td className={td + " font-medium"}>
                          <Link href={`/vehicles/${r.key}`} className="hover:underline">
                            {r.name}
                          </Link>
                        </td>
                        <td className={td}>{v ? `${v.maker} ${v.model}` : "-"}</td>
                        <td className={td}>{v ? L.division(v.divisionId) : "-"}</td>
                        <td className={td + " tabular text-right"}>{r.curCount}</td>
                        <td className={td + " tabular text-right font-medium"}>{yen(r.cur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </div>
        </div>
      )}
    </div>
  );
}

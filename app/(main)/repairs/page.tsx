import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { DeleteButton } from "@/components/DeleteButton";
import { DownloadIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, EmptyState, inputClass, Notice, PageHeader, TableWrap, td, th } from "@/components/ui";
import { deleteRepair } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { filterRepairs, lookup, type RepairFilter } from "@/lib/queries";
import { REPAIR_TYPES } from "@/lib/types";
import { formatDate, param, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "修理・整備履歴" };

const PAGE_SIZE = 50;

export default async function RepairsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await readDb();
  const L = lookup(db);
  const isAdmin = user.role === "admin";

  const f: RepairFilter = {
    q: param(sp.q),
    division: param(sp.division),
    type: param(sp.type),
    part: param(sp.part),
    vendor: param(sp.vendor),
    from: param(sp.from),
    to: param(sp.to),
  };
  const list = filterRepairs(db, user, f);
  const total = list.reduce((s, r) => s + r.cost, 0);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(param(sp.page)) || 1));
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const baseQuery = Object.entries(f).filter(([, v]) => v) as [string, string][];
  const query = new URLSearchParams(baseQuery).toString();
  const pageHref = (p: number) => "/repairs?" + new URLSearchParams([...baseQuery, ["page", String(p)]]).toString();
  const hasFilter = baseQuery.length > 0;
  const selectCls = inputClass + " py-2 text-sm";

  return (
    <div>
      {param(sp.saved) && <Notice>保存しました。</Notice>}
      <PageHeader
        title="修理・整備履歴"
        description="すべての修理・整備・車検の記録を確認できます"
        actions={
          <>
            <a href={`/api/export/repairs${query ? "?" + query : ""}`} className={btnSecondary}>
              <DownloadIcon className="size-4" />
              Excel用に出力（CSV）
            </a>
            <Link href="/repairs/new" className={btnPrimary}>
              <PlusIcon className="size-4" />
              修理・整備を登録
            </Link>
          </>
        }
      />

      <AutoSubmitForm className="mb-5 space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input name="q" defaultValue={f.q} placeholder="ナンバー・車名・作業内容で検索し Enter" className={inputClass + " pl-10"} />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {isAdmin && (
            <select name="division" defaultValue={f.division} className={selectCls} aria-label="事業部">
              <option value="">すべての事業部</option>
              {db.divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <select name="type" defaultValue={f.type} className={selectCls} aria-label="種別">
            <option value="">すべての種別</option>
            {REPAIR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select name="part" defaultValue={f.part} className={selectCls} aria-label="修理箇所">
            <option value="">すべての修理箇所</option>
            {db.parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="vendor" defaultValue={f.vendor} className={selectCls} aria-label="修理業者">
            <option value="">すべての業者</option>
            {db.vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={f.from} className={selectCls} aria-label="期間（開始）" title="期間（開始）" />
          <input type="date" name="to" defaultValue={f.to} className={selectCls} aria-label="期間（終了）" title="期間（終了）" />
        </div>
      </AutoSubmitForm>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-[var(--muted)]">
          <span className="tabular font-semibold text-neutral-900">{list.length}</span> 件・費用合計 <span className="tabular font-semibold text-neutral-900">{yen(total)}</span>
        </span>
        {hasFilter && (
          <Link href="/repairs" className="text-[var(--muted)] underline-offset-2 hover:text-neutral-900 hover:underline">
            条件をクリア
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState>条件に合う記録がありません。</EmptyState>
      ) : (
        <>
          <TableWrap>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>実施日</th>
                  <th className={th}>車両</th>
                  <th className={th}>事業部</th>
                  <th className={th}>種別</th>
                  <th className={th}>修理箇所</th>
                  <th className={th}>内容</th>
                  <th className={th}>業者</th>
                  <th className={th + " text-right"}>費用</th>
                  {isAdmin && <th className={th}></th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const v = L.vehicle(r.vehicleId);
                  return (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className={td + " tabular text-[var(--muted)]"}>{formatDate(r.date)}</td>
                      <td className={td + " font-medium"}>
                        <Link href={`/vehicles/${r.vehicleId}`} className="hover:underline">
                          {v?.plateNumber}
                        </Link>
                      </td>
                      <td className={td}>{v ? L.division(v.divisionId) : "-"}</td>
                      <td className={td}>{r.type}</td>
                      <td className={td}>{L.part(r.partId)}</td>
                      <td className={td + " max-w-[240px] truncate"} title={r.description}>
                        {r.description || "-"}
                      </td>
                      <td className={td}>{L.vendor(r.vendorId)}</td>
                      <td className={td + " tabular text-right"}>{yen(r.cost)}</td>
                      {isAdmin && (
                        <td className={td}>
                          <div className="flex justify-end gap-1">
                            <Link href={`/repairs/${r.id}/edit`} className="rounded-full px-2.5 py-1 text-xs hover:bg-neutral-100">
                              編集
                            </Link>
                            <DeleteButton small action={deleteRepair.bind(null, r.id)} confirmText={`${formatDate(r.date)}「${v?.plateNumber ?? ""}」の記録を削除しますか？`} />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={btnSecondary}>
                  ← 前へ
                </Link>
              ) : (
                <span className={btnSecondary + " pointer-events-none opacity-40"}>← 前へ</span>
              )}
              <span className="tabular px-3 text-[var(--muted)]">
                {page} / {pages} ページ
              </span>
              {page < pages ? (
                <Link href={pageHref(page + 1)} className={btnSecondary}>
                  次へ →
                </Link>
              ) : (
                <span className={btnSecondary + " pointer-events-none opacity-40"}>次へ →</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

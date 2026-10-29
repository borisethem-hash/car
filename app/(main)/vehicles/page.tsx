import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { DownloadIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, EmptyState, InspectionBadge, inputClass, PageHeader, StatusBadge, TableWrap, td, th } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { filterVehicles, lookup, type VehicleFilter } from "@/lib/queries";
import { VEHICLE_STATUSES } from "@/lib/types";
import { formatDate, km, param } from "@/lib/utils";

export const metadata: Metadata = { title: "車両台帳" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function VehiclesPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await readDb();
  const L = lookup(db);
  const isAdmin = user.role === "admin";

  const f: VehicleFilter = {
    q: param(sp.q),
    division: param(sp.division),
    category: param(sp.category),
    status: param(sp.status),
    inspection: param(sp.inspection),
    sort: param(sp.sort),
  };
  const list = filterVehicles(db, user, f);
  const query = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const hasFilter = Object.values(f).some((v) => v);

  const selectCls = inputClass + " py-2 text-sm";

  return (
    <div>
      <PageHeader
        title="車両台帳"
        description={isAdmin ? "全事業部の車両を検索・確認できます" : `${L.division(user.divisionId)}の車両を確認できます`}
        actions={
          <>
            <a href={`/api/export/vehicles${query ? "?" + query : ""}`} className={btnSecondary}>
              <DownloadIcon className="size-4" />
              Excel用に出力（CSV）
            </a>
            {isAdmin && (
              <Link href="/vehicles/new" className={btnPrimary}>
                <PlusIcon className="size-4" />
                車両を登録
              </Link>
            )}
          </>
        }
      />

      <AutoSubmitForm className="mb-5 space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input name="q" defaultValue={f.q} placeholder="ナンバー・メーカー・車名・担当者で検索し Enter" className={inputClass + " pl-10"} />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
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
          <select name="category" defaultValue={f.category} className={selectCls} aria-label="車両区分">
            <option value="">すべての車両区分</option>
            {db.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={f.status} className={selectCls} aria-label="状態">
            <option value="">すべての状態</option>
            <option value="active-all">廃車を除く</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="inspection" defaultValue={f.inspection} className={selectCls} aria-label="車検期限">
            <option value="">車検期限：すべて</option>
            <option value="expired">期限切れ</option>
            <option value="30">30日以内</option>
            <option value="60">60日以内</option>
            <option value="90">90日以内</option>
          </select>
          <select name="sort" defaultValue={f.sort} className={selectCls} aria-label="並び順">
            <option value="">並び順：車検期限が近い順</option>
            <option value="plate">並び順：ナンバー順</option>
            <option value="division">並び順：事業部順</option>
            <option value="mileage">並び順：走行距離が多い順</option>
          </select>
        </div>
      </AutoSubmitForm>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">
          <span className="tabular font-semibold text-neutral-900">{list.length}</span> 台が見つかりました
        </span>
        {hasFilter && (
          <Link href="/vehicles" className="text-[var(--muted)] underline-offset-2 hover:text-neutral-900 hover:underline">
            条件をクリア
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState>条件に合う車両がありません。検索条件を変えてお試しください。</EmptyState>
      ) : (
        <TableWrap>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>登録番号</th>
                <th className={th}>車名</th>
                <th className={th}>区分</th>
                <th className={th}>事業部</th>
                <th className={th}>車検満了日</th>
                <th className={th + " text-right"}>走行距離</th>
                <th className={th}>担当者</th>
                <th className={th}>状態</th>
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id} className={`hover:bg-neutral-50 ${v.status === "廃車" ? "text-neutral-400" : ""}`}>
                  <td className={td + " font-medium"}>
                    <Link href={`/vehicles/${v.id}`} className="hover:underline">
                      {v.plateNumber}
                    </Link>
                  </td>
                  <td className={td}>
                    {v.maker} {v.model}
                  </td>
                  <td className={td}>{L.category(v.categoryId)}</td>
                  <td className={td}>{L.division(v.divisionId)}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <span className="tabular">{formatDate(v.inspectionExpiry)}</span>
                      <InspectionBadge expiry={v.inspectionExpiry} status={v.status} />
                    </div>
                  </td>
                  <td className={td + " tabular text-right"}>{km(v.mileage)}</td>
                  <td className={td}>{v.manager}</td>
                  <td className={td}>
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  );
}

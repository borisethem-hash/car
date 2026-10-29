import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { PlusIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, Card, EmptyState, InspectionBadge, Notice, StatusBadge, TableWrap, td, th } from "@/components/ui";
import { deleteRepair, deleteVehicle } from "@/lib/actions";
import { canAccessVehicle, requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { lookup } from "@/lib/queries";
import { formatDate, km, param, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "車両の詳細" };

export default async function VehicleDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const db = readDb();
  const L = lookup(db);
  const vehicle = db.vehicles.find((v) => v.id === id);
  if (!vehicle || !canAccessVehicle(user, vehicle)) notFound();
  const isAdmin = user.role === "admin";

  const repairs = db.repairs.filter((r) => r.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = repairs.reduce((s, r) => s + r.cost, 0);

  const info: [string, React.ReactNode][] = [
    ["メーカー・車名", `${vehicle.maker} ${vehicle.model}`],
    ["車両区分", L.category(vehicle.categoryId)],
    ["事業部", L.division(vehicle.divisionId)],
    ["管理担当者", vehicle.manager || "-"],
    [
      "車検満了日",
      <span key="exp" className="flex flex-wrap items-center gap-2">
        <span className="tabular">{formatDate(vehicle.inspectionExpiry)}</span>
        <InspectionBadge expiry={vehicle.inspectionExpiry} status={vehicle.status} />
      </span>,
    ],
    ["初度登録", vehicle.firstRegistration ? formatDate(vehicle.firstRegistration) : "-"],
    ["走行距離", km(vehicle.mileage)],
    ["状態", <StatusBadge key="st" status={vehicle.status} />],
  ];

  return (
    <div>
      {param(sp.saved) && <Notice>保存しました。</Notice>}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/vehicles" className="text-sm text-[var(--muted)] hover:text-neutral-900">
            ← 車両台帳に戻る
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{vehicle.plateNumber}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {vehicle.maker} {vehicle.model}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/repairs/new?vehicleId=${vehicle.id}&returnTo=/vehicles/${vehicle.id}`} className={btnPrimary}>
            <PlusIcon className="size-4" />
            修理・整備を登録
          </Link>
          {isAdmin && (
            <>
              <Link href={`/vehicles/${vehicle.id}/edit`} className={btnSecondary}>
                編集
              </Link>
              <DeleteButton
                action={deleteVehicle.bind(null, vehicle.id)}
                redirectTo="/vehicles"
                confirmText={`「${vehicle.plateNumber}」を削除しますか？\nこの車両の修理履歴（${repairs.length}件）もすべて削除され、元に戻せません。\n\n※使わなくなった車両は、削除せず状態を「廃車」にすることをおすすめします。`}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card title="車両情報">
          <dl className="space-y-3.5">
            {info.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                <dt className="text-[var(--muted)]">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {vehicle.note && (
              <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                <dt className="text-[var(--muted)]">備考</dt>
                <dd className="whitespace-pre-wrap">{vehicle.note}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-semibold">修理・整備履歴</h2>
            <div className="text-sm text-[var(--muted)]">
              {repairs.length}件・合計 <span className="tabular font-semibold text-neutral-900">{yen(total)}</span>
            </div>
          </div>
          {repairs.length === 0 ? (
            <EmptyState>まだ修理・整備の記録はありません</EmptyState>
          ) : (
            <TableWrap>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>実施日</th>
                    <th className={th}>種別・箇所</th>
                    <th className={th}>内容</th>
                    <th className={th}>業者</th>
                    <th className={th + " text-right"}>費用</th>
                    {isAdmin && <th className={th}></th>}
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className={td + " tabular text-[var(--muted)]"}>{formatDate(r.date)}</td>
                      <td className={td}>
                        {r.type}・{L.part(r.partId)}
                      </td>
                      <td className={td + " max-w-[260px] truncate"} title={r.description}>
                        {r.description || "-"}
                      </td>
                      <td className={td}>{L.vendor(r.vendorId)}</td>
                      <td className={td + " tabular text-right"}>{yen(r.cost)}</td>
                      {isAdmin && (
                        <td className={td + " text-right"}>
                          <div className="flex justify-end gap-1">
                            <Link href={`/repairs/${r.id}/edit?returnTo=/vehicles/${vehicle.id}`} className="rounded-full px-2.5 py-1 text-xs hover:bg-neutral-100">
                              編集
                            </Link>
                            <DeleteButton small action={deleteRepair.bind(null, r.id)} confirmText={`${formatDate(r.date)} の「${L.part(r.partId)}」の記録を削除しますか？`} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      </div>
    </div>
  );
}

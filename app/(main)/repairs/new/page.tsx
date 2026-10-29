import type { Metadata } from "next";
import { RepairForm } from "@/components/RepairForm";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { param, safePath, todayStr } from "@/lib/utils";

export const metadata: Metadata = { title: "修理・整備の登録" };

export default async function NewRepairPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = readDb();
  const vehicleId = param(sp.vehicleId);
  const returnTo = safePath(param(sp.returnTo), "/repairs");

  const vehicles = db.vehicles
    .filter((v) => (user.role === "admin" || v.divisionId === user.divisionId) && (v.status !== "廃車" || v.id === vehicleId))
    .sort((a, b) => a.divisionId.localeCompare(b.divisionId) || a.plateNumber.localeCompare(b.plateNumber, "ja"))
    .map((v) => ({
      id: v.id,
      label: `${v.plateNumber}（${v.maker} ${v.model}／${db.divisions.find((d) => d.id === v.divisionId)?.name ?? ""}）`,
      mileage: v.mileage,
      inspectionExpiry: v.inspectionExpiry,
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="修理・整備の登録" description="請求書や作業明細を見ながら入力してください。" />
      <Card>
        <RepairForm vehicles={vehicles} parts={db.parts} vendors={db.vendors} defaultVehicleId={vehicleId} today={todayStr()} returnTo={returnTo} />
      </Card>
    </div>
  );
}

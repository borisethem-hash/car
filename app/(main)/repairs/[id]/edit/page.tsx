import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RepairForm } from "@/components/RepairForm";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { param, safePath, todayStr } from "@/lib/utils";

export const metadata: Metadata = { title: "修理・整備の編集" };

export default async function EditRepairPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const repair = db.repairs.find((r) => r.id === id);
  if (!repair) notFound();
  const returnTo = safePath(param(sp.returnTo), "/repairs");

  const vehicles = db.vehicles
    .slice()
    .sort((a, b) => a.divisionId.localeCompare(b.divisionId) || a.plateNumber.localeCompare(b.plateNumber, "ja"))
    .map((v) => ({
      id: v.id,
      label: `${v.plateNumber}（${v.maker} ${v.model}／${db.divisions.find((d) => d.id === v.divisionId)?.name ?? ""}）`,
      mileage: v.mileage,
      inspectionExpiry: v.inspectionExpiry,
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="修理・整備の編集" />
      <Card>
        <RepairForm repair={repair} vehicles={vehicles} parts={db.parts} vendors={db.vendors} today={todayStr()} returnTo={returnTo} />
      </Card>
    </div>
  );
}

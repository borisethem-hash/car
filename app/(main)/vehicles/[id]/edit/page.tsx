import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { VehicleForm } from "@/components/VehicleForm";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";

export const metadata: Metadata = { title: "車両の編集" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = readDb();
  const vehicle = db.vehicles.find((v) => v.id === id);
  if (!vehicle) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="車両の編集" description={vehicle.plateNumber} />
      <Card>
        <VehicleForm vehicle={vehicle} divisions={db.divisions} categories={db.categories} />
      </Card>
    </div>
  );
}

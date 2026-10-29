import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { VehicleForm } from "@/components/VehicleForm";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";

export const metadata: Metadata = { title: "車両の登録" };

export default async function NewVehiclePage() {
  await requireAdmin();
  const db = readDb();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="車両の登録" description="車検証を見ながら入力してください。「必須」の項目は必ず入力が必要です。" />
      <Card>
        <VehicleForm divisions={db.divisions} categories={db.categories} />
      </Card>
    </div>
  );
}

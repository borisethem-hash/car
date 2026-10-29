"use client";

import { useState } from "react";
import { ActionForm } from "./ActionForm";
import { Field, inputClass } from "./ui";
import { saveRepair } from "@/lib/actions";
import { REPAIR_TYPES, type Repair, type RepairPart, type Vendor } from "@/lib/types";

export type VehicleOption = { id: string; label: string; mileage: number; inspectionExpiry: string };

// 修理・整備履歴の登録・編集フォーム
export function RepairForm({
  repair,
  vehicles,
  parts,
  vendors,
  defaultVehicleId,
  today,
  returnTo,
}: {
  repair?: Repair;
  vehicles: VehicleOption[];
  parts: RepairPart[];
  vendors: Vendor[];
  defaultVehicleId?: string;
  today: string;
  returnTo: string;
}) {
  const [type, setType] = useState<string>(repair?.type ?? "修理");
  const [vehicleId, setVehicleId] = useState(repair?.vehicleId ?? defaultVehicleId ?? "");
  const selected = vehicles.find((v) => v.id === vehicleId);

  return (
    <ActionForm action={saveRepair} submitLabel={repair ? "変更を保存" : "登録する"} cancelHref={returnTo}>
      <input type="hidden" name="id" value={repair?.id ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="車両" required className="md:col-span-2" hint={selected ? `現在の走行距離：${selected.mileage.toLocaleString("ja-JP")} km` : undefined}>
          <select name="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className={inputClass}>
            <option value="">選択してください</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="実施日" required>
          <input name="date" type="date" defaultValue={repair?.date ?? today} required className={inputClass} />
        </Field>
        <Field label="種別" required>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {REPAIR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="修理箇所" required>
          <select name="partId" defaultValue={repair?.partId ?? ""} required className={inputClass}>
            <option value="">選択してください</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="修理業者" required>
          <select name="vendorId" defaultValue={repair?.vendorId ?? ""} required className={inputClass}>
            <option value="">選択してください</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="費用（税込・円）" required hint="数字のみ。例：35000">
          <input name="cost" inputMode="numeric" defaultValue={repair?.cost} required className={inputClass} placeholder="35000" />
        </Field>
        <Field label="実施時の走行距離（km）" hint="車両台帳より大きい場合、台帳も自動で更新されます">
          <input name="mileage" inputMode="numeric" defaultValue={repair?.mileage ?? selected?.mileage ?? ""} key={repair ? "fixed" : vehicleId} className={inputClass} />
        </Field>
        {type === "車検" && (
          <Field label="新しい車検満了日" className="md:col-span-2" hint="入力すると、車両台帳の車検満了日も自動で更新されます（新しい車検証の日付）">
            <input name="nextInspectionExpiry" type="date" className={inputClass} />
          </Field>
        )}
        <Field label="作業内容・メモ" className="md:col-span-2">
          <textarea name="description" defaultValue={repair?.description} rows={3} className={inputClass} placeholder="例：ブレーキパッド交換（前輪）" />
        </Field>
      </div>
    </ActionForm>
  );
}

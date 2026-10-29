import { ActionForm } from "./ActionForm";
import { Field, inputClass } from "./ui";
import { saveVehicle } from "@/lib/actions";
import { VEHICLE_STATUSES, type Category, type Division, type Vehicle } from "@/lib/types";

// 車両の登録・編集フォーム
export function VehicleForm({ vehicle, divisions, categories }: { vehicle?: Vehicle; divisions: Division[]; categories: Category[] }) {
  return (
    <ActionForm action={saveVehicle} submitLabel={vehicle ? "変更を保存" : "登録する"} cancelHref={vehicle ? `/vehicles/${vehicle.id}` : "/vehicles"}>
      <input type="hidden" name="id" value={vehicle?.id ?? ""} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="登録番号（ナンバー）" required hint="例：品川 300 あ 12-34" className="md:col-span-2">
          <input name="plateNumber" defaultValue={vehicle?.plateNumber} required className={inputClass} placeholder="品川 300 あ 12-34" />
        </Field>
        <Field label="メーカー" required>
          <input name="maker" defaultValue={vehicle?.maker} required className={inputClass} placeholder="例：トヨタ" />
        </Field>
        <Field label="車名" required>
          <input name="model" defaultValue={vehicle?.model} required className={inputClass} placeholder="例：プリウス" />
        </Field>
        <Field label="車両区分" required>
          <select name="categoryId" defaultValue={vehicle?.categoryId ?? ""} required className={inputClass}>
            <option value="">選択してください</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="事業部" required>
          <select name="divisionId" defaultValue={vehicle?.divisionId ?? ""} required className={inputClass}>
            <option value="">選択してください</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="車検満了日" required hint="車検証に記載の「有効期間の満了する日」">
          <input name="inspectionExpiry" type="date" defaultValue={vehicle?.inspectionExpiry} required className={inputClass} />
        </Field>
        <Field label="初度登録年月">
          <input name="firstRegistration" type="month" defaultValue={vehicle?.firstRegistration} className={inputClass} />
        </Field>
        <Field label="走行距離（km）" hint="数字のみ。例：35000">
          <input name="mileage" inputMode="numeric" defaultValue={vehicle?.mileage ?? 0} className={inputClass} />
        </Field>
        <Field label="管理担当者">
          <input name="manager" defaultValue={vehicle?.manager} className={inputClass} placeholder="例：山田" />
        </Field>
        <Field label="状態" required>
          <select name="status" defaultValue={vehicle?.status ?? "稼働中"} className={inputClass}>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="備考" className="md:col-span-2">
          <textarea name="note" defaultValue={vehicle?.note} rows={3} className={inputClass} placeholder="リース契約・保険・特記事項など" />
        </Field>
      </div>
    </ActionForm>
  );
}

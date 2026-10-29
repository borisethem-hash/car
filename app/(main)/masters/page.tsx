import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { DeleteButton } from "@/components/DeleteButton";
import { Card, Field, inputClass, Notice, PageHeader, TableWrap, td, th } from "@/components/ui";
import { deleteSimpleMaster, deleteVendor, resetDemoData, saveSimpleMaster, saveVendor } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { param } from "@/lib/utils";

export const metadata: Metadata = { title: "マスタ管理" };

const tabs = [
  { key: "vendors", label: "修理業者" },
  { key: "parts", label: "修理箇所" },
  { key: "divisions", label: "事業部" },
  { key: "categories", label: "車両区分" },
] as const;

type SimpleKind = "parts" | "divisions" | "categories";

export default async function MastersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = readDb();
  const tab = tabs.find((t) => t.key === param(sp.tab))?.key ?? "vendors";
  const editId = param(sp.edit);

  const usage = (kind: string, id: string): number => {
    if (kind === "vendors") return db.repairs.filter((r) => r.vendorId === id).length;
    if (kind === "parts") return db.repairs.filter((r) => r.partId === id).length;
    if (kind === "divisions") return db.vehicles.filter((v) => v.divisionId === id).length;
    return db.vehicles.filter((v) => v.categoryId === id).length;
  };
  const usageLabel = tab === "vendors" || tab === "parts" ? "修理件数" : "車両台数";

  return (
    <div>
      {param(sp.saved) && <Notice>保存しました。</Notice>}
      <PageHeader title="マスタ管理" description="入力時に選択肢として表示される項目を管理します" />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 text-sm sm:inline-flex">
        {tabs.map((t) => (
          <Link key={t.key} href={`/masters?tab=${t.key}`} className={`whitespace-nowrap rounded-full px-4 py-1.5 transition ${tab === t.key ? "bg-white font-medium shadow-sm" : "text-[var(--muted)] hover:text-neutral-900"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <TableWrap>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>名前</th>
                {tab === "vendors" && <th className={th}>電話番号</th>}
                <th className={th + " text-right"}>{usageLabel}</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {tab === "vendors"
                ? db.vendors.map((v) => (
                    <tr key={v.id} className={editId === v.id ? "bg-neutral-50" : "hover:bg-neutral-50"}>
                      <td className={td}>
                        <div className="font-medium">{v.name}</div>
                        {v.address && <div className="text-xs text-[var(--muted)]">{v.address}</div>}
                      </td>
                      <td className={td + " tabular"}>{v.phone || "-"}</td>
                      <td className={td + " tabular text-right"}>{usage("vendors", v.id)}</td>
                      <td className={td}>
                        <div className="flex justify-end gap-1">
                          <Link href={`/masters?tab=vendors&edit=${v.id}`} className="rounded-full px-2.5 py-1 text-xs hover:bg-neutral-100">
                            編集
                          </Link>
                          <DeleteButton small action={deleteVendor.bind(null, v.id)} confirmText={`「${v.name}」を削除しますか？`} />
                        </div>
                      </td>
                    </tr>
                  ))
                : db[tab as SimpleKind].map((item) => (
                    <tr key={item.id} className={editId === item.id ? "bg-neutral-50" : "hover:bg-neutral-50"}>
                      <td className={td + " font-medium"}>{item.name}</td>
                      <td className={td + " tabular text-right"}>{usage(tab, item.id)}</td>
                      <td className={td}>
                        <div className="flex justify-end gap-1">
                          <Link href={`/masters?tab=${tab}&edit=${item.id}`} className="rounded-full px-2.5 py-1 text-xs hover:bg-neutral-100">
                            編集
                          </Link>
                          <DeleteButton small action={deleteSimpleMaster.bind(null, tab as SimpleKind, item.id)} confirmText={`「${item.name}」を削除しますか？`} />
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </TableWrap>

        <div className="space-y-6">
          {tab === "vendors" ? (
            (() => {
              const v = db.vendors.find((x) => x.id === editId);
              return (
                <Card title={v ? "修理業者を編集" : "修理業者を追加"} key={editId || "new"}>
                  <ActionForm action={saveVendor} submitLabel={v ? "変更を保存" : "追加する"} cancelHref={v ? "/masters?tab=vendors" : undefined}>
                    <input type="hidden" name="id" value={v?.id ?? ""} />
                    <div className="space-y-4">
                      <Field label="業者名" required>
                        <input name="name" defaultValue={v?.name} required className={inputClass} />
                      </Field>
                      <Field label="電話番号">
                        <input name="phone" defaultValue={v?.phone} className={inputClass} placeholder="03-1234-5678" />
                      </Field>
                      <Field label="住所">
                        <input name="address" defaultValue={v?.address} className={inputClass} />
                      </Field>
                      <Field label="メモ">
                        <textarea name="note" defaultValue={v?.note} rows={2} className={inputClass} />
                      </Field>
                    </div>
                  </ActionForm>
                </Card>
              );
            })()
          ) : (
            (() => {
              const label = tabs.find((t) => t.key === tab)?.label ?? "";
              const item = db[tab as SimpleKind].find((x) => x.id === editId);
              return (
                <Card title={item ? `${label}を編集` : `${label}を追加`} key={tab + (editId || "new")}>
                  <ActionForm action={saveSimpleMaster} submitLabel={item ? "変更を保存" : "追加する"} cancelHref={item ? `/masters?tab=${tab}` : undefined}>
                    <input type="hidden" name="kind" value={tab} />
                    <input type="hidden" name="id" value={item?.id ?? ""} />
                    <Field label="名前" required>
                      <input name="name" defaultValue={item?.name} required className={inputClass} />
                    </Field>
                  </ActionForm>
                </Card>
              );
            })()
          )}
          <p className="text-xs leading-relaxed text-[var(--muted)]">※ すでにデータで使われている項目は削除できません。名前を変更すると、過去の記録の表示も新しい名前に変わります。</p>

          <Card title="デモデータの初期化">
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">操作の練習で変更したデータを、最初のデモデータの状態に戻します。本番運用を始める前に、この機能の扱いをご相談ください。</p>
            <DeleteButton action={resetDemoData} redirectTo="/" label="デモデータに戻す" confirmText={"すべてのデータを初期状態のデモデータに戻しますか？\n登録・変更した内容はすべて消えます。"} />
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { DeleteButton } from "@/components/DeleteButton";
import { Card, Field, inputClass, Notice, PageHeader, TableWrap, td, th } from "@/components/ui";
import { deleteUser, saveUser } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { lookup } from "@/lib/queries";
import { param } from "@/lib/utils";

export const metadata: Metadata = { title: "利用者管理" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const db = await readDb();
  const L = lookup(db);
  const editId = param(sp.edit);
  const editing = db.users.find((u) => u.id === editId);

  return (
    <div>
      {param(sp.saved) && <Notice>保存しました。</Notice>}
      <PageHeader title="利用者管理" description="システムにログインできる社員と、その権限を管理します" />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <TableWrap>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>氏名</th>
                <th className={th}>権限</th>
                <th className={th}>所属</th>
                <th className={th}>状態</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {db.users.map((u) => (
                <tr key={u.id} className={editId === u.id ? "bg-neutral-50" : "hover:bg-neutral-50"}>
                  <td className={td}>
                    <div className="font-medium">
                      {u.name}
                      {u.id === me.id && <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">（あなた）</span>}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{u.email}</div>
                  </td>
                  <td className={td}>
                    <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${u.role === "admin" ? "bg-neutral-900 text-white ring-neutral-900" : "bg-white text-neutral-700 ring-neutral-200"}`}>{u.role === "admin" ? "管理者" : "一般ユーザー"}</span>
                  </td>
                  <td className={td}>{L.division(u.divisionId)}</td>
                  <td className={td}>{u.active ? <span className="text-emerald-700">利用中</span> : <span className="text-neutral-400">停止中</span>}</td>
                  <td className={td}>
                    <div className="flex justify-end gap-1">
                      <Link href={`/users?edit=${u.id}`} className="rounded-full px-2.5 py-1 text-xs hover:bg-neutral-100">
                        編集
                      </Link>
                      {u.id !== me.id && <DeleteButton small action={deleteUser.bind(null, u.id)} confirmText={`「${u.name}」さんを削除しますか？\n一時的に使えなくする場合は「利用停止」がおすすめです。`} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>

        <div className="space-y-6">
          <Card title={editing ? "利用者を編集" : "利用者を追加"} key={editId || "new"}>
            <ActionForm action={saveUser} submitLabel={editing ? "変更を保存" : "追加する"} cancelHref={editing ? "/users" : undefined}>
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              <div className="space-y-4">
                <Field label="氏名" required>
                  <input name="name" defaultValue={editing?.name} required className={inputClass} placeholder="山田 太郎" />
                </Field>
                <Field label="メールアドレス" required hint="ログイン時に使います">
                  <input name="email" type="email" defaultValue={editing?.email} required className={inputClass} />
                </Field>
                <Field label={editing ? "新しいパスワード" : "パスワード"} required={!editing} hint={editing ? "変更する場合のみ入力（8文字以上）" : "8文字以上"}>
                  <input name="password" type="password" autoComplete="new-password" className={inputClass} />
                </Field>
                <Field label="権限" required>
                  <select name="role" defaultValue={editing?.role ?? "user"} className={inputClass}>
                    <option value="user">一般ユーザー（自分の事業部のみ）</option>
                    <option value="admin">管理者（すべての機能）</option>
                  </select>
                </Field>
                <Field label="所属事業部" hint="一般ユーザーは必須です。管理者は全事業部を見られます">
                  <select name="divisionId" defaultValue={editing?.divisionId ?? ""} className={inputClass}>
                    <option value="">（選択してください）</option>
                    {db.divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="状態">
                  <select name="active" defaultValue={editing && !editing.active ? "false" : "true"} className={inputClass}>
                    <option value="true">利用中</option>
                    <option value="false">利用停止（ログインできなくなります）</option>
                  </select>
                </Field>
              </div>
            </ActionForm>
          </Card>

          <Card title="権限の違い">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[var(--muted)]">
                  <th className="pb-2 text-left font-normal">できること</th>
                  <th className="pb-2 text-center font-normal">管理者</th>
                  <th className="pb-2 text-center font-normal">一般</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[
                  ["車両・履歴の閲覧", "全事業部", "自事業部"],
                  ["修理・整備の登録", "○", "自事業部"],
                  ["費用集計の閲覧", "全事業部", "自事業部"],
                  ["車両の登録・編集・削除", "○", "×"],
                  ["履歴の修正・削除", "○", "×"],
                  ["マスタ・利用者の管理", "○", "×"],
                ].map(([a, b, c]) => (
                  <tr key={a}>
                    <td className="py-2">{a}</td>
                    <td className="py-2 text-center">{b}</td>
                    <td className="py-2 text-center">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { Card, Field, inputClass, PageHeader } from "@/components/ui";
import { changeOwnPassword } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "パスワード変更" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="パスワード変更" description={`${user.name}（${user.email}）`} />
      <Card>
        <ActionForm action={changeOwnPassword} submitLabel="変更する">
          <div className="space-y-4">
            <Field label="現在のパスワード" required>
              <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
            </Field>
            <Field label="新しいパスワード" required hint="8文字以上">
              <input name="next" type="password" autoComplete="new-password" required className={inputClass} />
            </Field>
            <Field label="新しいパスワード（確認）" required>
              <input name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
            </Field>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}

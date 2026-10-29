"use client";

import { startTransition, useActionState, useState } from "react";
import { CarIcon } from "@/components/icons";
import { inputClass } from "@/components/ui";
import { login } from "@/lib/actions";

const testAccounts = [
  { label: "管理者", desc: "すべての機能を利用できます", email: "admin@example.com", password: "admin1234" },
  { label: "一般ユーザー", desc: "東京事業部の車両のみ閲覧・修理登録", email: "user@example.com", password: "user1234" },
];

export function LoginForm({ isDemo }: { isDemo: boolean }) {
  const [state, formAction, pending] = useActionState(login, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <CarIcon className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">車両管理システム</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">メールアドレスとパスワードでログインしてください</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
      >
        <input name="email" type="email" autoComplete="username" required placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass + " py-3"} />
        <input name="password" type="password" autoComplete="current-password" required placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass + " py-3"} />
        {state.error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <button type="submit" disabled={pending} className="w-full rounded-full bg-neutral-900 py-3 text-[15px] font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50">
          {pending ? "ログイン中…" : "ログイン"}
        </button>
      </form>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-3 text-xs text-[var(--muted)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          テスト用アカウント（クリックで自動入力）
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="space-y-2">
          {testAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(a.password);
              }}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-left transition hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{a.label}</span>
                <span className="text-xs text-[var(--muted)]">{a.desc}</span>
              </div>
              <div className="tabular mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 text-xs text-neutral-700">
                <span className="text-[var(--muted)]">メール</span>
                <span className="font-mono">{a.email}</span>
                <span className="text-[var(--muted)]">パスワード</span>
                <span className="font-mono">{a.password}</span>
              </div>
            </button>
          ))}
        </div>
        {isDemo && <p className="mt-4 text-center text-xs leading-relaxed text-[var(--muted)]">デモ版のため、登録・変更した内容はしばらくすると初期状態に戻ります。</p>}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import type { FormState } from "@/lib/types";
import { btnPrimary, btnSecondary } from "./ui";

// 登録・編集フォームの共通部品。
// エラー時も入力内容が消えないよう、送信処理をここでまとめて行います。

export function ActionForm({
  action,
  submitLabel = "保存する",
  cancelHref,
  children,
  className = "",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel?: string;
  cancelHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {children}
      {state.error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</div>}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "保存中…" : submitLabel}
        </button>
        {cancelHref && (
          <Link href={cancelHref} className={btnSecondary}>
            キャンセル
          </Link>
        )}
      </div>
    </form>
  );
}

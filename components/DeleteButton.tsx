"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActionResult } from "@/lib/types";
import { btnDanger } from "./ui";

// 削除ボタン。押すと確認メッセージを表示し、OK の場合のみ削除します。

export function DeleteButton({
  action,
  confirmText,
  redirectTo,
  label = "削除",
  small = false,
}: {
  action: () => Promise<ActionResult>;
  confirmText: string;
  redirectTo?: string;
  label?: string;
  small?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={small ? "rounded-full px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50" : btnDanger}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          const res = await action();
          if (!res.ok) {
            window.alert(res.error ?? "削除できませんでした。");
            return;
          }
          if (redirectTo) router.push(redirectTo);
          router.refresh();
        });
      }}
    >
      {pending ? "処理中…" : label}
    </button>
  );
}

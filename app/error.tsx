"use client";

// 予期しないエラーが起きた場合に表示される画面
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">エラーが発生しました</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">お手数ですが、もう一度お試しください。繰り返し発生する場合は管理者にご連絡ください。</p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm text-white hover:bg-neutral-700">
          再読み込み
        </button>
        <a href="/" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm hover:bg-neutral-50">
          ホームに戻る
        </a>
      </div>
    </div>
  );
}

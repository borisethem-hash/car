import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">削除されたか、閲覧する権限がない可能性があります。</p>
      <Link href="/" className="mt-6 rounded-full bg-neutral-900 px-5 py-2.5 text-sm text-white hover:bg-neutral-700">
        ホームに戻る
      </Link>
    </div>
  );
}

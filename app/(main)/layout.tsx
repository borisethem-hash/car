import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/auth";
import { readDb, storageMode } from "@/lib/db";

// ログイン後の全ページ共通の枠（左メニュー＋本文）
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = await readDb();
  const divisionName = user.divisionId ? db.divisions.find((d) => d.id === user.divisionId)?.name ?? "-" : "全事業部";
  const isDemo = storageMode() === "memory";

  return (
    <div className="min-h-screen">
      <Sidebar userName={user.name} roleLabel={user.role === "admin" ? "管理者" : "一般ユーザー"} divisionName={divisionName} isAdmin={user.role === "admin"} />
      <main className="md:pl-[260px]">
        {isDemo && (
          <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-center text-xs text-sky-800 sm:text-sm">
            デモ版です。自由に操作してお試しください（登録・変更した内容は、しばらくすると初期のデモデータに戻ります）。
          </div>
        )}
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}

import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";

// ログイン後の全ページ共通の枠（左メニュー＋本文）
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const divisionName = user.divisionId ? readDb().divisions.find((d) => d.id === user.divisionId)?.name ?? "-" : "全事業部";

  return (
    <div className="min-h-screen">
      <Sidebar userName={user.name} roleLabel={user.role === "admin" ? "管理者" : "一般ユーザー"} divisionName={divisionName} isAdmin={user.role === "admin"} />
      <main className="md:pl-[260px]">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}

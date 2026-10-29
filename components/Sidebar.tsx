"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/actions";
import { CarIcon, ChartIcon, CloseIcon, HelpIcon, HomeIcon, KeyIcon, ListIcon, LogoutIcon, MenuIcon, UsersIcon, WrenchIcon } from "./icons";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };

const nav: NavItem[] = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/vehicles", label: "車両台帳", icon: CarIcon },
  { href: "/repairs", label: "修理・整備履歴", icon: WrenchIcon },
  { href: "/reports", label: "費用集計", icon: ChartIcon },
  { href: "/masters", label: "マスタ管理", icon: ListIcon, adminOnly: true },
  { href: "/users", label: "利用者管理", icon: UsersIcon, adminOnly: true },
  { href: "/help", label: "使い方ガイド", icon: HelpIcon },
];

export function Sidebar({ userName, roleLabel, divisionName, isAdmin }: { userName: string; roleLabel: string; divisionName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pb-4 pt-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
          <CarIcon className="size-5" />
        </div>
        <div className="text-[15px] font-semibold">車両管理システム</div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {nav
          .filter((n) => !n.adminOnly || isAdmin)
          .map((n) => {
            const Icon = n.icon;
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-neutral-200/70 font-medium" : "text-neutral-700 hover:bg-neutral-200/50"}`}
              >
                <Icon className="size-[18px]" />
                {n.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-[var(--border)] p-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm text-white">{userName.slice(0, 1)}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{userName}</div>
            <div className="truncate text-xs text-[var(--muted)]">
              {roleLabel}・{divisionName}
            </div>
          </div>
        </div>
        <Link href="/account" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-200/50">
          <KeyIcon className="size-[18px]" />
          パスワード変更
        </Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-200/50">
            <LogoutIcon className="size-[18px]" />
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* スマートフォン用の上部バー */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--border)] bg-white/90 px-4 py-2.5 backdrop-blur md:hidden">
        <button type="button" aria-label="メニューを開く" onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-neutral-100">
          <MenuIcon />
        </button>
        <span className="text-[15px] font-semibold">車両管理システム</span>
      </header>

      {/* パソコン用のサイドバー */}
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-[var(--border)] bg-[var(--sidebar)] md:block">{content}</aside>

      {/* スマートフォン用のメニュー */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-[var(--sidebar)] shadow-xl">
            <button type="button" aria-label="メニューを閉じる" onClick={() => setOpen(false)} className="absolute right-2 top-3 rounded-lg p-1.5 hover:bg-neutral-200">
              <CloseIcon />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

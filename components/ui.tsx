// 画面共通の部品（見出し・カード・入力欄・バッジなど）

import Link from "next/link";
import { inspectionLabel, inspectionLevel } from "@/lib/utils";
import { AlertIcon, CheckIcon } from "./icons";

export const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[var(--border)] bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({ label, required, hint, children, className = "" }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
        {required && <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">必須</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

export function StatCard({ label, value, sub, tone = "default", href }: { label: string; value: string; sub?: string; tone?: "default" | "danger" | "warning"; href?: string }) {
  const toneClass = tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-neutral-900";
  const body = (
    <div className="h-full rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:bg-neutral-50">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className={`tabular mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function InspectionBadge({ expiry, status }: { expiry: string; status?: string }) {
  if (status === "廃車") return <span className="text-xs text-neutral-400">-</span>;
  const level = inspectionLevel(expiry);
  const label = inspectionLabel(expiry);
  const styles: Record<string, string> = {
    expired: "bg-red-50 text-red-700 ring-red-200",
    within30: "bg-orange-50 text-orange-700 ring-orange-200",
    within60: "bg-amber-50 text-amber-700 ring-amber-200",
    ok: "bg-neutral-50 text-neutral-600 ring-neutral-200",
  };
  const prefix = level === "expired" ? "期限切れ " : "";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${styles[level]}`}>
      {level !== "ok" && <AlertIcon className="size-3.5" />}
      {prefix}
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    稼働中: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    整備中: "bg-sky-50 text-sky-700 ring-sky-200",
    休車: "bg-neutral-100 text-neutral-600 ring-neutral-200",
    廃車: "bg-neutral-100 text-neutral-400 ring-neutral-200",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${styles[status] ?? styles["休車"]}`}>{status}</span>;
}

export function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "info" }) {
  const cls = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {tone === "success" && <CheckIcon className="size-4" />}
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">{children}</div>;
}

/** 表を囲む枠（スマートフォンでは横にスクロール） */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">{children}</div>;
}

export const th = "whitespace-nowrap border-b border-[var(--border)] bg-neutral-50 px-4 py-2.5 text-left text-xs font-medium text-[var(--muted)]";
export const td = "whitespace-nowrap border-b border-neutral-100 px-4 py-3 text-sm";

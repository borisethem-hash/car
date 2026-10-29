import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "使い方ガイド" };

const steps = [
  {
    title: "車両を探す",
    body: "左のメニューの「車両台帳」を開き、ナンバーや車名を入力して Enter キーを押します。事業部・車両区分・車検期限の選択肢を変えると、すぐに絞り込まれます。",
    href: "/vehicles",
  },
  {
    title: "修理・整備を記録する",
    body: "車両の詳細画面、またはホーム画面の「修理・整備を登録」から入力します。請求書を見ながら、実施日・修理箇所・業者・金額を入力して「登録する」を押してください。",
    href: "/repairs/new",
  },
  {
    title: "車検を記録する",
    body: "修理・整備の登録で種別を「車検」にすると「新しい車検満了日」の欄が表示されます。新しい車検証の日付を入力すると、車両台帳の車検満了日も自動で更新されます。",
    href: "/repairs/new",
  },
  {
    title: "車検期限を確認する",
    body: "ホーム画面に、期限切れ・30日以内・60日以内の車両が自動で表示されます。赤は期限切れ、オレンジは30日以内、黄色は60日以内です。",
    href: "/",
  },
  {
    title: "修理費用を比較する",
    body: "「費用集計」で年度を選ぶと、前の年度との比較が表示されます。今の年度が途中の場合は、前の年度の同じ期間と比べるので、公平に比較できます。",
    href: "/reports",
  },
  {
    title: "Excel で使う",
    body: "車両台帳と修理・整備履歴の画面にある「Excel用に出力（CSV）」を押すと、表示中の条件のデータをダウンロードできます。そのまま Excel で開けます。",
    href: "/vehicles",
  },
];

const faqs = [
  ["パスワードを忘れました", "管理者に連絡してください。管理者が「利用者管理」から新しいパスワードを設定できます。"],
  ["間違えて登録してしまいました", "管理者に連絡してください。管理者は登録済みの記録を修正・削除できます。"],
  ["他の事業部の車両が表示されません", "一般ユーザーは、所属する事業部の車両のみ表示されます。必要な場合は管理者に相談してください。"],
  ["使わなくなった車両はどうすればよいですか", "車両を編集して、状態を「廃車」にしてください。修理履歴は残したまま、車検期限のお知らせからは外れます。"],
  ["しばらく操作しないとログイン画面に戻ります", "安全のため、ログインから8時間でログアウトされます。もう一度ログインしてください。"],
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="使い方ガイド" description="はじめての方は、この順番で操作してみてください" />

      <ol className="mb-10 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link href={s.href} className="flex gap-4 rounded-2xl border border-[var(--border)] p-5 transition hover:bg-neutral-50">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">{i + 1}</span>
              <span>
                <span className="block font-medium">{s.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">{s.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Card title="よくある質問">
        <div className="divide-y divide-neutral-100">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-3">
              <summary className="cursor-pointer list-none font-medium">
                <span className="mr-2 text-[var(--muted)] group-open:hidden">＋</span>
                <span className="mr-2 hidden text-[var(--muted)] group-open:inline">−</span>
                {q}
              </summary>
              <p className="mt-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">{a}</p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}

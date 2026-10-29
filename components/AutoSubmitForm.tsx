"use client";

// 絞り込み用フォーム。選択肢を変えると自動で検索します（文字入力は Enter で検索）。

export function AutoSubmitForm({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <form
      method="get"
      className={className}
      onChange={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "SELECT" || (target as HTMLInputElement).type === "date") {
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}

// CSV（Excel で開ける形式）の作成

function cell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvResponse(filename: string, header: string[], rows: (string | number)[][]): Response {
  // 先頭の BOM（\uFEFF）により Excel で文字化けせずに開けます
  const body = "\uFEFF" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}

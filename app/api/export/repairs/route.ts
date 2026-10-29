import { getCurrentUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { readDb } from "@/lib/db";
import { filterRepairs, lookup } from "@/lib/queries";
import { todayStr } from "@/lib/utils";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("ログインが必要です", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const db = await readDb();
  const L = lookup(db);
  const list = filterRepairs(db, user, {
    q: sp.get("q") ?? "",
    division: sp.get("division") ?? "",
    type: sp.get("type") ?? "",
    part: sp.get("part") ?? "",
    vendor: sp.get("vendor") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
  });
  return csvResponse(
    `修理整備履歴_${todayStr()}.csv`,
    ["実施日", "登録番号", "車名", "事業部", "種別", "修理箇所", "修理業者", "費用(円)", "走行距離(km)", "作業内容"],
    list.map((r) => {
      const v = L.vehicle(r.vehicleId);
      return [r.date, v?.plateNumber ?? "", v ? `${v.maker} ${v.model}` : "", v ? L.division(v.divisionId) : "", r.type, L.part(r.partId), L.vendor(r.vendorId), r.cost, r.mileage, r.description];
    }),
  );
}

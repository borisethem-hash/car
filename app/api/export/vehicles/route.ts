import { getCurrentUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { readDb } from "@/lib/db";
import { filterVehicles, lookup } from "@/lib/queries";
import { todayStr } from "@/lib/utils";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("ログインが必要です", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const db = await readDb();
  const L = lookup(db);
  const list = filterVehicles(db, user, {
    q: sp.get("q") ?? "",
    division: sp.get("division") ?? "",
    category: sp.get("category") ?? "",
    status: sp.get("status") ?? "",
    inspection: sp.get("inspection") ?? "",
    sort: sp.get("sort") ?? "",
  });
  return csvResponse(
    `車両台帳_${todayStr()}.csv`,
    ["登録番号", "メーカー", "車名", "車両区分", "事業部", "車検満了日", "初度登録", "走行距離(km)", "管理担当者", "状態", "備考"],
    list.map((v) => [v.plateNumber, v.maker, v.model, L.category(v.categoryId), L.division(v.divisionId), v.inspectionExpiry, v.firstRegistration, v.mileage, v.manager, v.status, v.note]),
  );
}

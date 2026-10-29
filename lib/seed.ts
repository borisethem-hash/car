// デモデータ（本番運用を想定したサンプルデータ）の作成
// 乱数の種を固定しているため、何度作り直しても同じ内容になります。
// 日付は「作成した日」を基準にするため、車検期限アラートなどが常に現実的に表示されます。

import { hashPassword } from "./password";
import type { Category, Database, Division, Repair, RepairPart, RepairType, User, Vehicle, VehicleStatus, Vendor } from "./types";
import { addDays, addYears, daysBetween, todayStr } from "./utils";

function createRandom(seed: number) {
  let a = seed;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
  };
}

const divisions: Division[] = [
  { id: "d01", name: "本社営業部" },
  { id: "d02", name: "東京事業部" },
  { id: "d03", name: "大阪事業部" },
  { id: "d04", name: "名古屋事業部" },
  { id: "d05", name: "福岡事業部" },
  { id: "d06", name: "札幌事業部" },
  { id: "d07", name: "建設事業部" },
  { id: "d08", name: "物流事業部" },
];

const categories: Category[] = [
  { id: "c01", name: "乗用車" },
  { id: "c02", name: "軽自動車" },
  { id: "c03", name: "バン（小型貨物）" },
  { id: "c04", name: "トラック" },
  { id: "c05", name: "特殊車両" },
];

const vendors: Vendor[] = [
  { id: "v01", name: "品川オートサービス", phone: "03-5555-0101", address: "東京都品川区南品川1-2-3", note: "乗用車・バン全般。代車あり" },
  { id: "v02", name: "浪速モータース", phone: "06-5555-0202", address: "大阪府大阪市浪速区元町2-4-6", note: "" },
  { id: "v03", name: "中部カーメンテナンス", phone: "052-555-0303", address: "愛知県名古屋市中川区八熊3-1-8", note: "土曜も対応可" },
  { id: "v04", name: "博多自動車整備工場", phone: "092-555-0404", address: "福岡県福岡市博多区東光1-5-10", note: "" },
  { id: "v05", name: "札幌北モータース", phone: "011-555-0505", address: "北海道札幌市東区北20条東4-2", note: "冬タイヤ保管サービスあり" },
  { id: "v06", name: "関東トラックサービス", phone: "045-555-0606", address: "神奈川県横浜市鶴見区大黒町5-3", note: "大型・特殊車両対応" },
  { id: "v07", name: "多摩タイヤセンター", phone: "042-555-0707", address: "東京都立川市曙町2-8-1", note: "タイヤ・足回り専門" },
  { id: "v08", name: "全国ロードサービス", phone: "0120-555-808", address: "東京都千代田区丸の内1-1-1", note: "故障時の出張修理・レッカー" },
];

const parts: RepairPart[] = [
  { id: "p01", name: "エンジン" },
  { id: "p02", name: "ブレーキ" },
  { id: "p03", name: "タイヤ" },
  { id: "p04", name: "バッテリー" },
  { id: "p05", name: "エアコン" },
  { id: "p06", name: "車体・板金" },
  { id: "p07", name: "電装品" },
  { id: "p08", name: "オイル交換" },
  { id: "p09", name: "法定点検" },
  { id: "p10", name: "車検整備" },
  { id: "p11", name: "足回り・サスペンション" },
  { id: "p12", name: "その他" },
];

// 修理箇所ごとの費用の目安（円）と作業内容の例
const partCosts: Record<string, { min: number; max: number; texts: string[] }> = {
  p01: { min: 50000, max: 280000, texts: ["エンジン不調のため点火プラグ・イグニッションコイル交換", "オイル漏れ修理（ガスケット交換）", "ラジエーター交換", "ウォーターポンプ交換"] },
  p02: { min: 20000, max: 80000, texts: ["ブレーキパッド交換（前輪）", "ブレーキパッド・ローター交換", "ブレーキフルード交換"] },
  p03: { min: 30000, max: 120000, texts: ["タイヤ4本交換", "冬タイヤへ履き替え", "パンク修理・タイヤ1本交換", "夏タイヤへ履き替え"] },
  p04: { min: 15000, max: 45000, texts: ["バッテリー上がりのため交換", "バッテリー交換（定期）"] },
  p05: { min: 20000, max: 120000, texts: ["エアコンガス補充", "エアコンコンプレッサー交換", "エアコンフィルター交換"] },
  p06: { min: 30000, max: 250000, texts: ["駐車場での接触によるバンパー修理", "左側面スライドドア板金塗装", "リアゲートへこみ修理", "フロントガラス交換（飛び石）"] },
  p07: { min: 10000, max: 80000, texts: ["ヘッドライトバルブ交換", "ドライブレコーダー取付", "オルタネーター交換", "パワーウィンドウ修理"] },
  p08: { min: 5000, max: 15000, texts: ["エンジンオイル交換", "エンジンオイル・オイルエレメント交換"] },
  p09: { min: 15000, max: 40000, texts: ["法定12ヶ月点検", "法定3ヶ月点検"] },
  p11: { min: 30000, max: 150000, texts: ["ショックアブソーバー交換", "タイロッドエンド交換", "ホイールアライメント調整"] },
  p12: { min: 5000, max: 50000, texts: ["ワイパーブレード交換", "室内清掃・消臭", "鍵の作製"] },
};

const models: Record<string, { maker: string; model: string }[]> = {
  c01: [
    { maker: "トヨタ", model: "プリウス" },
    { maker: "トヨタ", model: "カローラ" },
    { maker: "ホンダ", model: "フィット" },
    { maker: "日産", model: "ノート" },
    { maker: "マツダ", model: "CX-5" },
  ],
  c02: [
    { maker: "スズキ", model: "エブリイ" },
    { maker: "ダイハツ", model: "ハイゼット" },
    { maker: "ホンダ", model: "N-BOX" },
    { maker: "スズキ", model: "アルト" },
  ],
  c03: [
    { maker: "トヨタ", model: "ハイエース" },
    { maker: "トヨタ", model: "プロボックス" },
    { maker: "日産", model: "NV200バネット" },
    { maker: "日産", model: "キャラバン" },
  ],
  c04: [
    { maker: "いすゞ", model: "エルフ" },
    { maker: "日野", model: "デュトロ" },
    { maker: "三菱ふそう", model: "キャンター" },
    { maker: "いすゞ", model: "フォワード" },
  ],
  c05: [
    { maker: "日野", model: "レンジャー（クレーン付）" },
    { maker: "いすゞ", model: "エルフ（高所作業車）" },
    { maker: "三菱ふそう", model: "キャンター（ダンプ）" },
  ],
};

// 事業部ごとの台数・ナンバーの地域・よく使う業者・車両区分の傾向
const divisionProfiles: Record<string, { count: number; areas: string[]; vendors: string[]; cats: string[] }> = {
  d01: { count: 18, areas: ["品川", "練馬"], vendors: ["v01", "v07"], cats: ["c01", "c01", "c01", "c02", "c03"] },
  d02: { count: 15, areas: ["品川", "足立", "練馬"], vendors: ["v01", "v07"], cats: ["c01", "c02", "c03", "c03"] },
  d03: { count: 14, areas: ["なにわ", "大阪"], vendors: ["v02"], cats: ["c01", "c02", "c03", "c03"] },
  d04: { count: 12, areas: ["名古屋", "尾張小牧"], vendors: ["v03"], cats: ["c01", "c02", "c03"] },
  d05: { count: 11, areas: ["福岡", "北九州"], vendors: ["v04"], cats: ["c01", "c02", "c03"] },
  d06: { count: 10, areas: ["札幌"], vendors: ["v05"], cats: ["c01", "c02", "c03", "c04"] },
  d07: { count: 10, areas: ["多摩", "八王子"], vendors: ["v06", "v07"], cats: ["c04", "c05", "c05", "c03"] },
  d08: { count: 10, areas: ["横浜", "川崎"], vendors: ["v06"], cats: ["c04", "c04", "c03"] },
};

const classNumbers: Record<string, string[]> = {
  c01: ["300", "330", "500", "530"],
  c02: ["480", "580", "880"],
  c03: ["400", "430", "480"],
  c04: ["100", "130", "400"],
  c05: ["800", "830", "100"],
};

const kana = "あいうえかきくけこさすせそたちつてとなにぬねのはひふほまみむめもやゆよらりるれろわ".split("");
const familyNames = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "松本", "井上", "木村", "林", "清水", "山口"];

const costMultiplier: Record<string, number> = { c01: 1, c02: 0.7, c03: 1.1, c04: 1.6, c05: 1.9 };
const inspectionCost: Record<string, [number, number]> = {
  c01: [80000, 140000],
  c02: [55000, 90000],
  c03: [70000, 130000],
  c04: [150000, 320000],
  c05: [200000, 420000],
};
// 車検の間隔（年）：乗用・軽は2年、貨物・特殊は1年
const inspectionInterval: Record<string, number> = { c01: 2, c02: 2, c03: 1, c04: 1, c05: 1 };

function roundCost(n: number): number {
  return Math.round(n / 100) * 100;
}

export function createSeedData(): Database {
  const rand = createRandom(20240401);
  const today = todayStr();
  const now = new Date().toISOString();
  const historyStart = "2024-04-01";

  // 車検満了日の分布：期限切れ3台・30日以内8台・60日以内8台・その他
  const expiryOffsets: number[] = [];
  for (let i = 0; i < 100; i++) {
    if (i < 3) expiryOffsets.push(-(4 + i * 9));
    else if (i < 11) expiryOffsets.push(2 + (i - 3) * 4);
    else if (i < 19) expiryOffsets.push(33 + (i - 11) * 3);
    else expiryOffsets.push(rand.int(65, 720));
  }
  // 並び替え（シャッフル）
  for (let i = expiryOffsets.length - 1; i > 0; i--) {
    const j = Math.floor(rand.next() * (i + 1));
    [expiryOffsets[i], expiryOffsets[j]] = [expiryOffsets[j], expiryOffsets[i]];
  }

  const vehicles: Vehicle[] = [];
  const repairs: Repair[] = [];
  const usedPlates = new Set<string>();
  let vNo = 0;
  let rNo = 0;

  for (const division of divisions) {
    const profile = divisionProfiles[division.id];
    for (let k = 0; k < profile.count; k++) {
      const categoryId = rand.pick(profile.cats);
      const m = rand.pick(models[categoryId]);
      let plate = "";
      do {
        const num = rand.int(10, 99) + "-" + String(rand.int(0, 99)).padStart(2, "0");
        plate = `${rand.pick(profile.areas)} ${rand.pick(classNumbers[categoryId])} ${rand.pick(kana)} ${num}`;
      } while (usedPlates.has(plate));
      usedPlates.add(plate);

      const regYear = rand.int(2015, 2024);
      const regMonth = rand.int(1, 12);
      const yearsUsed = Math.max(0.5, daysBetween(`${regYear}-${String(regMonth).padStart(2, "0")}-01`, today) / 365);
      const perYear = categoryId === "c04" || categoryId === "c05" ? rand.int(18000, 32000) : rand.int(7000, 18000);
      const mileage = Math.round((yearsUsed * perYear) / 100) * 100;

      const offset = expiryOffsets[vNo];
      const inspectionExpiry = addDays(today, offset);

      let status: VehicleStatus = "稼働中";
      if (vNo === 7 || vNo === 41 || vNo === 77) status = "整備中";
      if (vNo === 23 || vNo === 64) status = "休車";
      if (vNo === 88) status = "廃車";

      vNo++;
      const id = `veh${String(vNo).padStart(3, "0")}`;
      const vehicle: Vehicle = {
        id,
        plateNumber: plate,
        maker: m.maker,
        model: m.model,
        categoryId,
        divisionId: division.id,
        firstRegistration: `${regYear}-${String(regMonth).padStart(2, "0")}`,
        inspectionExpiry,
        mileage,
        manager: rand.pick(familyNames),
        status,
        note: status === "整備中" ? "修理工場に入庫中" : status === "休車" ? "予備車として保管" : status === "廃車" ? "老朽化のため廃車手続き済み" : "",
        createdAt: now,
        updatedAt: now,
      };
      vehicles.push(vehicle);

      const mileageAt = (date: string) => {
        const d = daysBetween(date, today);
        return Math.max(100, Math.round((mileage - (d / 365) * perYear) / 100) * 100);
      };
      const vendorFor = () => (rand.next() < 0.85 ? rand.pick(profile.vendors) : rand.pick(["v08", "v07", profile.vendors[0]]));
      const mult = costMultiplier[categoryId];
      const addRepair = (date: string, type: RepairType, partId: string, cost: number, description: string) => {
        if (date < historyStart || date > today) return;
        rNo++;
        repairs.push({
          id: `rep${String(rNo).padStart(4, "0")}`,
          vehicleId: id,
          date,
          type,
          partId,
          vendorId: vendorFor(),
          cost: roundCost(cost),
          mileage: mileageAt(date),
          description,
          createdBy: "u_admin",
          createdAt: now,
        });
      };

      // 過去の車検（満了日から逆算）
      const interval = inspectionInterval[categoryId];
      for (let n = 1; n <= 3; n++) {
        const prevExpiry = addYears(inspectionExpiry, -interval * n);
        const [lo, hi] = inspectionCost[categoryId];
        addRepair(addDays(prevExpiry, -rand.int(3, 20)), "車検", "p10", rand.int(lo, hi), "継続車検（法定費用・整備費用含む）");
      }

      // 日常の修理・整備
      const count = status === "廃車" ? 2 : rand.int(3, 8);
      const span = daysBetween(historyStart, today);
      for (let n = 0; n < count; n++) {
        const date = addDays(historyStart, rand.int(0, span));
        const r = rand.next();
        let type: RepairType;
        let partId: string;
        if (r < 0.3) {
          type = "定期整備";
          partId = "p08";
        } else if (r < 0.45) {
          type = "点検";
          partId = "p09";
        } else {
          type = "修理";
          partId = rand.pick(["p01", "p02", "p02", "p03", "p03", "p04", "p05", "p06", "p06", "p07", "p11", "p12"]);
        }
        const c = partCosts[partId];
        // 今年度は物価上昇で少し高め
        const inflation = date >= `${today.slice(0, 4)}-01-01` ? 1.08 : 1;
        addRepair(date, type, partId, rand.int(c.min, c.max) * mult * inflation, rand.pick(c.texts));
      }
    }
  }

  repairs.sort((a, b) => (a.date < b.date ? 1 : -1));

  const users: User[] = [
    { id: "u_admin", name: "管理者 太郎", email: "admin@example.com", passwordHash: hashPassword("admin1234"), role: "admin", divisionId: null, active: true, createdAt: now },
    { id: "u_user", name: "東京 花子", email: "user@example.com", passwordHash: hashPassword("user1234"), role: "user", divisionId: "d02", active: true, createdAt: now },
    { id: "u_003", name: "高橋 直子", email: "takahashi@example.com", passwordHash: hashPassword("user1234"), role: "admin", divisionId: null, active: true, createdAt: now },
    { id: "u_004", name: "山田 一郎", email: "yamada@example.com", passwordHash: hashPassword("user1234"), role: "user", divisionId: "d03", active: true, createdAt: now },
    { id: "u_005", name: "佐藤 美咲", email: "sato@example.com", passwordHash: hashPassword("user1234"), role: "user", divisionId: "d04", active: true, createdAt: now },
    { id: "u_006", name: "鈴木 健太", email: "suzuki@example.com", passwordHash: hashPassword("user1234"), role: "user", divisionId: "d05", active: false, createdAt: now },
  ];

  return { divisions, categories, vendors, parts, vehicles, repairs, users };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessVehicle, createSession, destroySession, getCurrentUser } from "./auth";
import { newId, readDb, resetDb, updateDb } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { safePath } from "./utils";
import { REPAIR_TYPES, VEHICLE_STATUSES, type ActionResult, type FormState, type RepairType, type Role, type VehicleStatus } from "./types";

// 画面からの登録・更新・削除はすべてここを通ります。
// 各処理の最初で「ログインしているか」「権限があるか」を必ず確認しています。

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function isDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

function toNumber(v: string): number | null {
  const n = Number(v.replace(/[,，円¥\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

const NOT_ALLOWED = "この操作を行う権限がありません。";

// ───────── ログイン ─────────

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const password = text(fd, "password");
  if (!email || !password) return { error: "メールアドレスとパスワードを入力してください。" };

  const user = (await readDb()).users.find((u) => u.email.toLowerCase() === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }
  if (!user.active) return { error: "このアカウントは利用停止中です。管理者にお問い合わせください。" };

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ───────── 車両 ─────────

export async function saveVehicle(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: NOT_ALLOWED };

  const id = text(fd, "id");
  const plateNumber = text(fd, "plateNumber").replace(/\s+/g, " ");
  const maker = text(fd, "maker");
  const model = text(fd, "model");
  const categoryId = text(fd, "categoryId");
  const divisionId = text(fd, "divisionId");
  const firstRegistration = text(fd, "firstRegistration");
  const inspectionExpiry = text(fd, "inspectionExpiry");
  const mileage = toNumber(text(fd, "mileage") || "0");
  const manager = text(fd, "manager");
  const status = text(fd, "status") as VehicleStatus;
  const note = text(fd, "note");

  if (!plateNumber) return { error: "登録番号（ナンバー）を入力してください。" };
  if (!maker || !model) return { error: "メーカーと車名を入力してください。" };
  if (!categoryId) return { error: "車両区分を選択してください。" };
  if (!divisionId) return { error: "事業部を選択してください。" };
  if (!isDate(inspectionExpiry)) return { error: "車検満了日を正しく入力してください。" };
  if (firstRegistration && !/^\d{4}-\d{2}$/.test(firstRegistration)) return { error: "初度登録年月を正しく入力してください。" };
  if (mileage === null) return { error: "走行距離は0以上の数字で入力してください。" };
  if (!VEHICLE_STATUSES.includes(status)) return { error: "状態を選択してください。" };

  const db = await readDb();
  const normalized = plateNumber.replace(/\s/g, "");
  if (db.vehicles.some((v) => v.id !== id && v.plateNumber.replace(/\s/g, "") === normalized)) {
    return { error: "同じ登録番号の車両がすでに登録されています。" };
  }

  const now = new Date().toISOString();
  let savedId = id;
  const result = await updateDb((d) => {
    if (id) {
      const v = d.vehicles.find((x) => x.id === id);
      if (!v) return "車両が見つかりません。削除された可能性があります。";
      Object.assign(v, { plateNumber, maker, model, categoryId, divisionId, firstRegistration, inspectionExpiry, mileage, manager, status, note, updatedAt: now });
    } else {
      savedId = newId("veh");
      d.vehicles.push({ id: savedId, plateNumber, maker, model, categoryId, divisionId, firstRegistration, inspectionExpiry, mileage, manager, status, note, createdAt: now, updatedAt: now });
    }
    return null;
  });
  if (result) return { error: result };

  revalidatePath("/", "layout");
  redirect(`/vehicles/${savedId}?saved=1`);
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: NOT_ALLOWED };
  await updateDb((d) => {
    d.vehicles = d.vehicles.filter((v) => v.id !== id);
    d.repairs = d.repairs.filter((r) => r.vehicleId !== id);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────── 修理・整備履歴 ─────────

export async function saveRepair(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "ログインの有効期限が切れました。もう一度ログインしてください。" };

  const id = text(fd, "id");
  const vehicleId = text(fd, "vehicleId");
  const date = text(fd, "date");
  const type = text(fd, "type") as RepairType;
  const partId = text(fd, "partId");
  const vendorId = text(fd, "vendorId");
  const cost = toNumber(text(fd, "cost"));
  const mileage = toNumber(text(fd, "mileage") || "0");
  const description = text(fd, "description");
  const returnTo = text(fd, "returnTo");

  if (!vehicleId) return { error: "車両を選択してください。" };
  if (!isDate(date)) return { error: "実施日を正しく入力してください。" };
  if (!REPAIR_TYPES.includes(type)) return { error: "種別を選択してください。" };
  if (!partId) return { error: "修理箇所を選択してください。" };
  if (!vendorId) return { error: "修理業者を選択してください。" };
  if (cost === null) return { error: "費用は0以上の数字で入力してください（例：35000）。" };
  if (mileage === null) return { error: "走行距離は0以上の数字で入力してください。" };

  const db = await readDb();
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return { error: "選択された車両が見つかりません。" };
  if (!canAccessVehicle(user, vehicle)) return { error: "他の事業部の車両には登録できません。" };
  if (id && user.role !== "admin") return { error: "登録済みの履歴の修正は管理者のみ行えます。" };

  const result = await updateDb((d) => {
    if (id) {
      const r = d.repairs.find((x) => x.id === id);
      if (!r) return "履歴が見つかりません。削除された可能性があります。";
      Object.assign(r, { vehicleId, date, type, partId, vendorId, cost, mileage, description });
    } else {
      d.repairs.push({ id: newId("rep"), vehicleId, date, type, partId, vendorId, cost, mileage, description, createdBy: user.id, createdAt: new Date().toISOString() });
    }
    // 走行距離が車両台帳より大きければ台帳も更新
    const v = d.vehicles.find((x) => x.id === vehicleId);
    if (v && mileage > v.mileage) {
      v.mileage = mileage;
      v.updatedAt = new Date().toISOString();
    }
    // 車検を登録した場合、満了日が入力されていれば台帳も更新
    const nextExpiry = text(fd, "nextInspectionExpiry");
    if (v && type === "車検" && isDate(nextExpiry)) {
      v.inspectionExpiry = nextExpiry;
      v.updatedAt = new Date().toISOString();
    }
    return null;
  });
  if (result) return { error: result };

  revalidatePath("/", "layout");
  const safeReturn = safePath(returnTo, `/vehicles/${vehicleId}`);
  redirect(safeReturn + (safeReturn.includes("?") ? "&" : "?") + "saved=1");
}

export async function deleteRepair(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: NOT_ALLOWED };
  await updateDb((d) => {
    d.repairs = d.repairs.filter((r) => r.id !== id);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────── マスタ（修理業者・修理箇所・事業部・車両区分） ─────────

export async function saveVendor(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: NOT_ALLOWED };
  const id = text(fd, "id");
  const name = text(fd, "name");
  const phone = text(fd, "phone");
  const address = text(fd, "address");
  const note = text(fd, "note");
  if (!name) return { error: "業者名を入力してください。" };
  const db = await readDb();
  if (db.vendors.some((v) => v.id !== id && v.name === name)) return { error: "同じ名前の業者がすでに登録されています。" };
  await updateDb((d) => {
    if (id) {
      const v = d.vendors.find((x) => x.id === id);
      if (v) Object.assign(v, { name, phone, address, note });
    } else {
      d.vendors.push({ id: newId("v"), name, phone, address, note });
    }
  });
  revalidatePath("/", "layout");
  redirect("/masters?tab=vendors&saved=1");
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: NOT_ALLOWED };
  const used = (await readDb()).repairs.filter((r) => r.vendorId === id).length;
  if (used > 0) return { ok: false, error: `この業者は修理履歴で${used}件使われているため削除できません。` };
  await updateDb((d) => {
    d.vendors = d.vendors.filter((v) => v.id !== id);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

type SimpleMaster = "parts" | "divisions" | "categories";
const masterLabels: Record<SimpleMaster, string> = { parts: "修理箇所", divisions: "事業部", categories: "車両区分" };

export async function saveSimpleMaster(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: NOT_ALLOWED };
  const kind = text(fd, "kind") as SimpleMaster;
  if (!(kind in masterLabels)) return { error: "不正な操作です。" };
  const id = text(fd, "id");
  const name = text(fd, "name");
  if (!name) return { error: `${masterLabels[kind]}の名前を入力してください。` };
  const db = await readDb();
  const existing: { id: string; name: string }[] = db[kind];
  if (existing.some((x) => x.id !== id && x.name === name)) return { error: `同じ名前の${masterLabels[kind]}がすでにあります。` };
  await updateDb((d) => {
    const list: { id: string; name: string }[] = d[kind];
    if (id) {
      const item = list.find((x) => x.id === id);
      if (item) item.name = name;
    } else {
      list.push({ id: newId(kind.slice(0, 1)), name });
    }
  });
  revalidatePath("/", "layout");
  redirect(`/masters?tab=${kind}&saved=1`);
}

export async function deleteSimpleMaster(kind: SimpleMaster, id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: NOT_ALLOWED };
  const db = await readDb();
  let used = 0;
  if (kind === "parts") used = db.repairs.filter((r) => r.partId === id).length;
  if (kind === "divisions") used = db.vehicles.filter((v) => v.divisionId === id).length + db.users.filter((u) => u.divisionId === id).length;
  if (kind === "categories") used = db.vehicles.filter((v) => v.categoryId === id).length;
  if (used > 0) return { ok: false, error: `この${masterLabels[kind]}は${used}件のデータで使われているため削除できません。` };
  await updateDb((d) => {
    if (kind === "parts") d.parts = d.parts.filter((x) => x.id !== id);
    if (kind === "divisions") d.divisions = d.divisions.filter((x) => x.id !== id);
    if (kind === "categories") d.categories = d.categories.filter((x) => x.id !== id);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────── 利用者 ─────────

export async function saveUser(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: NOT_ALLOWED };
  const id = text(fd, "id");
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  const password = text(fd, "password");
  const role = text(fd, "role") as Role;
  const divisionId = text(fd, "divisionId");
  const active = text(fd, "active") !== "false";

  if (!name) return { error: "氏名を入力してください。" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "メールアドレスを正しく入力してください。" };
  if (role !== "admin" && role !== "user") return { error: "権限を選択してください。" };
  if (role === "user" && !divisionId) return { error: "一般ユーザーは所属事業部の選択が必要です。" };
  if (!id && password.length < 8) return { error: "パスワードは8文字以上で入力してください。" };
  if (id && password && password.length < 8) return { error: "パスワードは8文字以上で入力してください。" };
  if (id === me.id && (role !== "admin" || !active)) return { error: "自分自身の管理者権限の解除・利用停止はできません。" };

  const db = await readDb();
  if (db.users.some((u) => u.id !== id && u.email.toLowerCase() === email)) return { error: "このメールアドレスはすでに使われています。" };

  await updateDb((d) => {
    const division = role === "admin" ? null : divisionId;
    if (id) {
      const u = d.users.find((x) => x.id === id);
      if (u) {
        Object.assign(u, { name, email, role, divisionId: division, active });
        if (password) u.passwordHash = hashPassword(password);
      }
    } else {
      d.users.push({ id: newId("u"), name, email, passwordHash: hashPassword(password), role, divisionId: division, active, createdAt: new Date().toISOString() });
    }
  });
  revalidatePath("/", "layout");
  redirect("/users?saved=1");
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { ok: false, error: NOT_ALLOWED };
  if (id === me.id) return { ok: false, error: "自分自身は削除できません。" };
  await updateDb((d) => {
    d.users = d.users.filter((u) => u.id !== id);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) return { error: "ログインしてください。" };
  const current = text(fd, "current");
  const next = text(fd, "next");
  const confirm = text(fd, "confirm");
  const user = (await readDb()).users.find((u) => u.id === me.id);
  if (!user || !verifyPassword(current, user.passwordHash)) return { error: "現在のパスワードが正しくありません。" };
  if (next.length < 8) return { error: "新しいパスワードは8文字以上で入力してください。" };
  if (next !== confirm) return { error: "新しいパスワード（確認）が一致しません。" };
  await updateDb((d) => {
    const u = d.users.find((x) => x.id === me.id);
    if (u) u.passwordHash = hashPassword(next);
  });
  return { success: "パスワードを変更しました。" };
}

// ───────── デモデータ初期化 ─────────

export async function resetDemoData(): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { ok: false, error: NOT_ALLOWED };
  await resetDb();
  revalidatePath("/", "layout");
  return { ok: true };
}

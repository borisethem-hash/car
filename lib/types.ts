// システムで扱うデータの型定義

export type Role = "admin" | "user";

export interface Division {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
}

export interface RepairPart {
  id: string;
  name: string;
}

export const VEHICLE_STATUSES = ["稼働中", "整備中", "休車", "廃車"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export interface Vehicle {
  id: string;
  plateNumber: string; // 登録番号（ナンバー）
  maker: string;
  model: string;
  categoryId: string;
  divisionId: string;
  firstRegistration: string; // 初度登録 YYYY-MM
  inspectionExpiry: string; // 車検満了日 YYYY-MM-DD
  mileage: number; // 走行距離 km
  manager: string; // 管理担当者
  status: VehicleStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export const REPAIR_TYPES = ["修理", "定期整備", "車検", "点検"] as const;
export type RepairType = (typeof REPAIR_TYPES)[number];

export interface Repair {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  type: RepairType;
  partId: string;
  vendorId: string;
  cost: number; // 税込金額（円）
  mileage: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  divisionId: string | null; // 一般ユーザーの所属事業部（管理者は null = 全事業部）
  active: boolean;
  createdAt: string;
}

export interface Database {
  divisions: Division[];
  categories: Category[];
  vendors: Vendor[];
  parts: RepairPart[];
  vehicles: Vehicle[];
  repairs: Repair[];
  users: User[];
}

export type SessionUser = Omit<User, "passwordHash">;

export interface FormState {
  error?: string;
  success?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

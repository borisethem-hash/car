import "server-only";
import type { Database, Repair, SessionUser, Vehicle } from "./types";
import { daysBetween, todayStr } from "./utils";

export interface VehicleFilter {
  q: string;
  division: string;
  category: string;
  status: string;
  inspection: string; // "" | expired | 30 | 60 | 90
  sort: string; // inspection | plate | division | mileage
}

export function filterVehicles(db: Database, user: SessionUser, f: VehicleFilter): Vehicle[] {
  const today = todayStr();
  const q = f.q.trim().toLowerCase();
  const divisionName = (id: string) => db.divisions.find((d) => d.id === id)?.name ?? "";

  let list = db.vehicles.filter((v) => {
    if (user.role !== "admin" && v.divisionId !== user.divisionId) return false;
    if (f.division && v.divisionId !== f.division) return false;
    if (f.category && v.categoryId !== f.category) return false;
    if (f.status) {
      if (f.status === "active-all") {
        if (v.status === "廃車") return false;
      } else if (v.status !== f.status) return false;
    }
    if (f.inspection) {
      const days = daysBetween(today, v.inspectionExpiry);
      if (f.inspection === "expired" && days >= 0) return false;
      if (f.inspection !== "expired" && (days < 0 || days > Number(f.inspection))) return false;
    }
    if (q) {
      const text = `${v.plateNumber} ${v.maker} ${v.model} ${v.manager} ${v.note} ${divisionName(v.divisionId)}`.toLowerCase();
      // 「品川300」のように空白なしで入力されても見つかるよう、空白を除いて比較
      if (!text.includes(q) && !text.replace(/\s/g, "").includes(q.replace(/\s/g, ""))) return false;
    }
    return true;
  });

  list = [...list].sort((a, b) => {
    switch (f.sort) {
      case "plate":
        return a.plateNumber.localeCompare(b.plateNumber, "ja");
      case "division":
        return a.divisionId.localeCompare(b.divisionId) || a.plateNumber.localeCompare(b.plateNumber, "ja");
      case "mileage":
        return b.mileage - a.mileage;
      default:
        return a.inspectionExpiry.localeCompare(b.inspectionExpiry);
    }
  });
  return list;
}

export interface RepairFilter {
  q: string;
  division: string;
  type: string;
  part: string;
  vendor: string;
  from: string;
  to: string;
}

export function filterRepairs(db: Database, user: SessionUser, f: RepairFilter): Repair[] {
  const vehicleMap = new Map(db.vehicles.map((v) => [v.id, v]));
  const q = f.q.trim().toLowerCase();
  return db.repairs
    .filter((r) => {
      const v = vehicleMap.get(r.vehicleId);
      if (!v) return false;
      if (user.role !== "admin" && v.divisionId !== user.divisionId) return false;
      if (f.division && v.divisionId !== f.division) return false;
      if (f.type && r.type !== f.type) return false;
      if (f.part && r.partId !== f.part) return false;
      if (f.vendor && r.vendorId !== f.vendor) return false;
      if (f.from && r.date < f.from) return false;
      if (f.to && r.date > f.to) return false;
      if (q) {
        const text = `${v.plateNumber} ${v.maker} ${v.model} ${r.description}`.toLowerCase();
        if (!text.includes(q) && !text.replace(/\s/g, "").includes(q.replace(/\s/g, ""))) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function lookup(db: Database) {
  const divisions = new Map(db.divisions.map((d) => [d.id, d.name]));
  const categories = new Map(db.categories.map((c) => [c.id, c.name]));
  const vendors = new Map(db.vendors.map((v) => [v.id, v.name]));
  const parts = new Map(db.parts.map((p) => [p.id, p.name]));
  const vehicles = new Map(db.vehicles.map((v) => [v.id, v]));
  return {
    division: (id: string | null) => (id ? divisions.get(id) ?? "（削除済み）" : "全事業部"),
    category: (id: string) => categories.get(id) ?? "（削除済み）",
    vendor: (id: string) => vendors.get(id) ?? "（削除済み）",
    part: (id: string) => parts.get(id) ?? "（削除済み）",
    vehicle: (id: string) => vehicles.get(id),
  };
}

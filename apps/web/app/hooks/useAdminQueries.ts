"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface Driver {
  _id: string;
  name: string;
  username: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  assignedVehicle?: {
    _id: string;
    name: string;
    vehicleNumber: string;
    capacity: string;
    isActive: boolean;
  } | null;
}

interface Vehicle {
  _id: string;
  name: string;
  vehicleNumber: string;
  capacity: string;
  isActive: boolean;
  createdAt: string;
}

interface SupplyLog {
  _id: string;
  suppliedAt: string;
  formattedSuppliedAt?: string;
  pointName: string;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  cashType?: "debit" | "fuel";
  adminRemark?: string;
  billImageUrl?: string;
  billImagePublicId?: string;
  driver?: {
    _id: string;
    name: string;
    username: string;
    phone?: string;
  };
  vehicle?: {
    _id: string;
    name: string;
    vehicleNumber: string;
    capacity: string;
  };
}

interface PaginatedSupplyLogs {
  logs: SupplyLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DRIVERS_KEY = ["admin", "drivers"];
const VEHICLES_KEY = ["admin", "vehicles"];

export function useAdminDrivers() {
  return useQuery<Driver[]>({
    queryKey: DRIVERS_KEY,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    queryFn: async () => {
      const res = await fetch("/api/admin/drivers", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch drivers");
      }
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as Driver[]) : [];
    },
  });
}

export function useAdminVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: VEHICLES_KEY,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    queryFn: async () => {
      const res = await fetch("/api/admin/vehicles", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as Vehicle[]) : [];
    },
  });
}

export function useAdminTodayStats(todayIso: string) {
  return useQuery({
    queryKey: ["admin", "stats", todayIso],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats?date=${encodeURIComponent(todayIso)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard stats");
      const data = (await res.json()) as { drivers: number; vehicles: number; todaySupplies: number };
      return {
        drivers: data.drivers,
        vehicles: data.vehicles,
        todaySupplies: data.todaySupplies,
      };
    },
  });
}

export function useAdminPaginatedSupplies(page: number, limit: number) {
  return useQuery<PaginatedSupplyLogs>({
    queryKey: ["admin", "supplies", "paginated", page, limit],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const res = await fetch(`/api/admin/supplies?page=${page}&limit=${limit}&logType=water`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load recent supplies");
      }
      const data = (await res.json()) as PaginatedSupplyLogs;
      const baseLogs = Array.isArray(data.logs) ? data.logs : [];
      const logsWithFormatted = baseLogs.map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
      return { ...data, logs: logsWithFormatted };
    },
  });
}

export function useAdminPendingSupplies() {
  return useQuery<SupplyLog[]>({
    queryKey: ["admin", "supplies", "pending"],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const res = await fetch("/api/admin/supplies?amountStatus=pending&logType=water&page=1&limit=100", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch pending supplies");
      }
      const data = (await res.json()) as unknown;
      const paged = data as PaginatedSupplyLogs;
      const baseLogs = Array.isArray(paged.logs) ? paged.logs : [];
      return baseLogs.map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
    },
  });
}

export function useAdminAddedSupplies(filters: {
  date: string;
  month: string;
  driver: string;
  vehicle: string;
}) {
  return useQuery<SupplyLog[]>({
    queryKey: ["admin", "supplies", "added", filters],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("amountStatus", "added");
      params.set("logType", "water");
      if (filters.date) params.set("date", filters.date);
      if (filters.month) params.set("month", filters.month);
      if (filters.driver) params.set("driver", filters.driver);
      if (filters.vehicle) params.set("vehicle", filters.vehicle);

      const res = await fetch(`/api/admin/supplies?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch water supplies");
      }
      const data = (await res.json()) as unknown;
      const baseLogs = Array.isArray(data) ? (data as SupplyLog[]) : [];
      return baseLogs.map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
    },
  });
}

export function useAdminCashCredits(filters: {
  date: string;
  month: string;
  driver: string;
  vehicle: string;
}) {
  return useQuery<SupplyLog[]>({
    queryKey: ["admin", "supplies", "cash-credits", filters],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("logType", "cash");
      if (filters.date) params.set("date", filters.date);
      if (filters.month) params.set("month", filters.month);
      if (filters.driver) params.set("driver", filters.driver);
      if (filters.vehicle) params.set("vehicle", filters.vehicle);

      const res = await fetch(`/api/admin/supplies?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch cash credits");
      }
      const data = (await res.json()) as unknown;
      const baseLogs = Array.isArray(data) ? (data as SupplyLog[]) : [];
      return baseLogs.map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
    },
  });
}

export function useAdminQueryClient() {
  return useQueryClient();
}

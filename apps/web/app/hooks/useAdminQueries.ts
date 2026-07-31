"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

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

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  area?: string;
  locationType?: "home" | "office" | "both";
  subscriptionCans: number;
  cashPerCan?: number;
  securityDeposit?: number;
  isActive: boolean;
  registeredDate?: string;
  createdAt: string;
}

export interface PaginatedCustomers {
  customers: Customer[];
  total: number;
  activeCount: number;
  inactiveCount: number;
  page: number;
  limit: number;
  totalPages: number;
  areas: string[];
}

export interface SupplyLog {
  _id: string;
  suppliedAt: string;
  formattedSuppliedAt?: string;
  pointName?: string;
  cansDelivered?: number;
  cansTakenBack?: number;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  cashType?: "debit" | "fuel";
  paymentStatus?: "cash" | "upi" | "not_paid";
  adminRemark?: string;
  billImageUrl?: string;
  billImagePublicId?: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    area?: string;
  };
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

export interface PaginatedSupplyLogsWithStats {
  logs: SupplyLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  serialStart?: number;
  stats: {
    totalCans: number;
    totalCansTakenBack: number;
    totalAmount: number;
    uniqueDrivers: number;
    uniqueCustomers: number;
  };
}

const DRIVERS_KEY = ["admin", "drivers"];
const VEHICLES_KEY = ["admin", "vehicles"];
const CUSTOMERS_KEY = ["admin", "customers"];

export function useAdminDrivers() {
  return useQuery<Driver[]>({
    queryKey: DRIVERS_KEY,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
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
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
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

// Full customer list for use in dropdowns (no pagination)
export function useAdminCustomers() {
  return useQuery<Customer[]>({
    queryKey: CUSTOMERS_KEY,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as Customer[]) : [];
    },
  });
}

// Paginated customer list for the customers management page
export function useAdminPaginatedCustomers(params: {
  page: number;
  limit: number;
  search: string;
  area: string;
}) {
  return useQuery<PaginatedCustomers>({
    queryKey: ["admin", "customers", "paginated", params],
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set("page", String(params.page));
      p.set("limit", String(params.limit));
      if (params.search) p.set("search", params.search);
      if (params.area) p.set("area", params.area);
      const res = await fetch(`/api/admin/customers?${p.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return (await res.json()) as PaginatedCustomers;
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
      const data = (await res.json()) as { drivers: number; vehicles: number; todayDeliveries: number; customers: number };
      return {
        drivers: data.drivers,
        vehicles: data.vehicles,
        todayDeliveries: data.todayDeliveries,
        customers: data.customers,
      };
    },
  });
}

export function useAdminPaginatedSupplies(page: number, limit: number) {
  return useQuery<PaginatedSupplyLogs>({
    queryKey: ["admin", "supplies", "paginated", page, limit],
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
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

const SUPPLIES_PAGE_LIMIT = 50;

export function useAdminAddedSupplies(
  filters: {
    date: string;
    month: string;
    driver: string;
    vehicle: string;
    customer?: string;
    paymentStatus?: string;
    days?: number;
  },
  page: number,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginatedSupplyLogsWithStats>({
    queryKey: ["admin", "supplies", "added", filters, page],
    staleTime: 1000 * 30,
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("logType", "water");
      params.set("page", String(page));
      params.set("limit", String(SUPPLIES_PAGE_LIMIT));
      if (filters.date) params.set("date", filters.date);
      if (filters.month) params.set("month", filters.month);
      if (filters.driver) params.set("driver", filters.driver);
      if (filters.vehicle) params.set("vehicle", filters.vehicle);
      if (filters.customer) params.set("customer", filters.customer);
      if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
      if (filters.days) params.set("days", String(filters.days));

      const res = await fetch(`/api/admin/supplies?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch water supplies");
      }
      const data = (await res.json()) as PaginatedSupplyLogsWithStats;
      const logs = (data.logs ?? []).map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
      return { ...data, logs };
    },
  });
}

export function useAdminCashCredits(
  filters: {
    date: string;
    month: string;
    driver: string;
    vehicle: string;
    paymentStatus?: string;
    days?: number;
  },
  page: number,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginatedSupplyLogsWithStats>({
    queryKey: ["admin", "supplies", "cash-credits", filters, page],
    staleTime: 1000 * 30,
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("logType", "cash");
      params.set("page", String(page));
      params.set("limit", String(SUPPLIES_PAGE_LIMIT));
      if (filters.date) params.set("date", filters.date);
      if (filters.month) params.set("month", filters.month);
      if (filters.driver) params.set("driver", filters.driver);
      if (filters.vehicle) params.set("vehicle", filters.vehicle);
      if (filters.days) params.set("days", String(filters.days));

      const res = await fetch(`/api/admin/supplies?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch cash credits");
      }
      const data = (await res.json()) as PaginatedSupplyLogsWithStats;
      const logs = (data.logs ?? []).map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
      return { ...data, logs };
    },
  });
}

// Single customer details for the history page
export function useAdminCustomerDetail(customerId: string) {
  return useQuery<Customer>({
    queryKey: ["admin", "customers", "detail", customerId],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(customerId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${customerId}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch customer");
      }
      return (await res.json()) as Customer;
    },
  });
}

// Paginated supply history for one customer, with lifetime stats
export function useAdminCustomerHistory(
  customerId: string,
  filters: { month: string; paymentStatus: string },
  page: number
) {
  return useQuery<PaginatedSupplyLogsWithStats>({
    queryKey: ["admin", "supplies", "customer-history", customerId, filters, page],
    staleTime: 1000 * 30,
    enabled: Boolean(customerId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("customer", customerId);
      params.set("page", String(page));
      params.set("limit", String(SUPPLIES_PAGE_LIMIT));
      if (filters.month) params.set("month", filters.month);
      if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);

      const res = await fetch(`/api/admin/supplies?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch customer history");
      }
      const data = (await res.json()) as PaginatedSupplyLogsWithStats;
      const logs = (data.logs ?? []).map((log) => ({
        ...log,
        formattedSuppliedAt: log.formattedSuppliedAt ?? formatDateTime(log.suppliedAt),
      }));
      return { ...data, logs };
    },
  });
}

export function useAdminQueryClient() {
  return useQueryClient();
}

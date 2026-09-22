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
  cashPerCase?: number;
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
  casesDelivered?: number;
  notes?: string;
  amount?: number;
  logType?: "water" | "cash";
  // Missing on older deliveries, which count as "can".
  productType?: "can" | "case";
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
    totalCases: number;
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

const SUPPLIES_PAGE_LIMIT = 50;

type SupplyFilters = {
  date: string;
  month: string;
  driver: string;
  vehicle: string;
  customer?: string;
  paymentStatus?: string;
  productType?: string;
  days?: number;
};

// Query params for the Deliveries and Cash Credits lists. The sheet download
// builds its request here too, so it always covers what the list shows.
function supplyFilterParams(logType: "water" | "cash", filters: SupplyFilters) {
  const params = new URLSearchParams();
  params.set("logType", logType);
  if (filters.date) params.set("date", filters.date);
  if (filters.month) params.set("month", filters.month);
  if (filters.driver) params.set("driver", filters.driver);
  if (filters.vehicle) params.set("vehicle", filters.vehicle);
  if (logType === "water") {
    if (filters.customer) params.set("customer", filters.customer);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.productType) params.set("productType", filters.productType);
  }
  if (filters.days) params.set("days", String(filters.days));
  return params;
}

// Every log matching the list's filters, not just the current page — the rows
// behind the summary totals. Used for the sheet download.
export async function fetchAllSupplies(logType: "water" | "cash", filters: SupplyFilters): Promise<SupplyLog[]> {
  const res = await fetch(`/api/admin/supplies?${supplyFilterParams(logType, filters).toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(logType === "water" ? "Failed to fetch water supplies" : "Failed to fetch cash credits");
  }
  return (await res.json()) as SupplyLog[];
}

export function useAdminAddedSupplies(
  filters: SupplyFilters,
  page: number,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginatedSupplyLogsWithStats>({
    queryKey: ["admin", "supplies", "added", filters, page],
    staleTime: 1000 * 30,
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = supplyFilterParams("water", filters);
      params.set("page", String(page));
      params.set("limit", String(SUPPLIES_PAGE_LIMIT));

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
      const params = supplyFilterParams("cash", filters);
      params.set("page", String(page));
      params.set("limit", String(SUPPLIES_PAGE_LIMIT));

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

export interface NewCustomer {
  _id: string;
  name: string;
  phone: string;
  area?: string;
  address?: string;
  locationType?: "home" | "office" | "both";
  subscriptionCans: number;
  cashPerCan?: number;
  cashPerCase?: number;
  isActive: boolean;
  isDeleted?: boolean;
  registeredDate?: string;
  createdAt: string;
  addedBy:
    | { kind: "admin" }
    | { kind: "driver"; name: string; username: string }
    | { kind: "deleted-driver" };
}

export interface NewCustomersResponse {
  fromDay: string;
  toDay: string;
  total: number;
  limit: number;
  customers: NewCustomer[];
}

// Customers behind the analytics "New Customers" number. `rangeQuery` is the
// same from/to or days query string the analytics page sends, so both agree.
export function useAdminNewCustomers(rangeQuery: string, options?: { enabled?: boolean }) {
  return useQuery<NewCustomersResponse>({
    queryKey: ["admin", "analytics", "new-customers", rangeQuery],
    staleTime: 1000 * 60 * 2,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/new-customers?${rangeQuery}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load new customers");
      return (await res.json()) as NewCustomersResponse;
    },
  });
}

export function useAdminQueryClient() {
  return useQueryClient();
}

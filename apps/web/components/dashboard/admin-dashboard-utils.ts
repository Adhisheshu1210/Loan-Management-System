import { createElement, type ReactNode } from "react";

export type AdminSection = "overview" | "users" | "loans" | "payments" | "analytics" | "profile";

export type AdminNavItem = {
  label: string;
  href: string;
  section: AdminSection;
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  secondaryEmail?: string | null;
  phoneVerifiedAt?: string | null;
  secondaryEmailVerifiedAt?: string | null;
  createdAt: string;
};

export type AdminLoan = {
  _id: string;
  amount: number;
  tenure: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  rejectionReason?: string | null;
  sanctionNotes?: string | null;
  transactionReference?: string | null;
  disbursementProofUrl?: string | null;
  proofFileUrl?: string | null;
  proofFileType?: string | null;
  disbursementDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  borrower?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  } | null;
};

export type AdminPayment = {
  _id: string;
  amount: number;
  utrNumber: string;
  paymentDate: string;
  createdAt: string;
  loan?: {
    _id?: string;
    status?: string;
    amount?: number;
    tenure?: number;
    dueDate?: string | null;
  } | null;
  borrower?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  } | null;
  collector?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  secondaryEmail?: string | null;
  secondaryEmailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMetricSet = {
  totalLoans: number;
  activeLoans: number;
  closedLoans: number;
  usersTotal: number;
  totalDisbursed: number;
  totalCollections: number;
};

export type AdminChartPoint = {
  month: string;
  value: number;
};

export type AdminPiePoint = {
  name: string;
  value: number;
  color?: string;
};

export type AdminDashboardResponse = {
  metrics: AdminMetricSet;
  charts: {
    loanVolume: AdminChartPoint[];
    collectionsTrend: AdminChartPoint[];
    loanLifecycle: AdminPiePoint[];
    roleBreakdown: AdminPiePoint[];
  };
  recentLoans: AdminLoan[];
};

export type AdminAnalyticsResponse = {
  charts: {
    loanVolume: AdminChartPoint[];
    collectionsTrend: AdminChartPoint[];
    loanLifecycle: AdminPiePoint[];
    roleBreakdown: AdminPiePoint[];
  };
  recentPayments: AdminPayment[];
};

export type AdminLoanReview = {
  loan: AdminLoan;
  borrower: AdminLoan["borrower"] | null;
  profile: {
    pan?: string | null;
    dob?: string | null;
    salary?: number | null;
    employmentMode?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
  documents: Array<{
    _id: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
    createdAt: string;
  }>;
  payments: AdminPayment[];
};

export const adminNavItems: AdminNavItem[] = [
  { label: "Overview", href: "/dashboard/overview", section: "overview" },
  { label: "Users", href: "/dashboard/users", section: "users" },
  { label: "Loans", href: "/dashboard/loans", section: "loans" },
  { label: "Payments", href: "/dashboard/payments", section: "payments" },
  { label: "Analytics", href: "/dashboard/analytics", section: "analytics" },
  { label: "Profile", href: "/dashboard/profile", section: "profile" },
];

export const roleOptions = ["ALL", "ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION", "BORROWER"] as const;

export const loanStatusOptions = ["ALL", "APPLIED", "SANCTIONED", "DISBURSED", "CLOSED", "REJECTED"] as const;

export function loanCode(id: string) {
  return `LN-${id.slice(-6).toUpperCase()}`;
}

export function statusLabel(status: string) {
  switch (status) {
    case "APPLIED":
      return "Pending";
    case "WITHDRAWN":
      return "Withdrawn";
    case "SANCTIONED":
      return "Approved";
    case "DISBURSED":
      return "Disbursed";
    case "CLOSED":
      return "Closed";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export function statusClass(status: string) {
  switch (status) {
    case "APPLIED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700";
    case "WITHDRAWN":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700";
    case "SANCTIONED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
    case "DISBURSED":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700";
    case "REJECTED":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700";
    case "CLOSED":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700";
    default:
      return "bg-secondary";
  }
}

export function formatCurrency(value: number) {
  return `₹${value.toLocaleString()}`;
}

export function csvEscape(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadCsv(filename: string, csv: string | Blob) {
  const blob = csv instanceof Blob ? csv : new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SectionCard({ children }: { children: ReactNode }) {
  return createElement("div", { className: "rounded-[28px] border bg-card/85 shadow-soft backdrop-blur" }, children);
}
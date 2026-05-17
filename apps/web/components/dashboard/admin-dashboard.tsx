"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Download, Filter, Search, Users, BadgeIndianRupee, Banknote, CircleDollarSign, FileText, ShieldCheck, Clock3, Landmark, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { resolveFileUrl } from "@/lib/utils";

type DashboardMetricSet = {
  totalLoans: number;
  activeLoans: number;
  closedLoans: number;
  usersTotal: number;
  totalDisbursed: number;
  totalCollections: number;
};

type AdminChartPoint = {
  month: string;
  value: number;
};

type AdminPiePoint = {
  name: string;
  value: number;
  color?: string;
};

type AdminLoan = {
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

type AdminDashboardResponse = {
  metrics: DashboardMetricSet;
  charts: {
    loanVolume: AdminChartPoint[];
    collectionsTrend: AdminChartPoint[];
    loanLifecycle: AdminPiePoint[];
    roleBreakdown: AdminPiePoint[];
  };
  recentLoans: AdminLoan[];
};

type AdminUser = {
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

type AdminSection = "Overview" | "Users" | "Loans" | "Payments" | "Analytics";

type AdminPayment = {
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

type AdminDocument = {
  _id: string;
  borrowerId?: string;
  fileUrl: string;
  fileType: string;
  publicId?: string | null;
  uploadedAt: string;
  createdAt: string;
  borrower?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  } | null;
  latestLoan?: {
    _id?: string;
    status?: string;
    amount?: number;
    tenure?: number;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

type AdminProfile = {
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

type AdminAnalyticsResponse = {
  charts: {
    loanVolume: AdminChartPoint[];
    collectionsTrend: AdminChartPoint[];
    loanLifecycle: AdminPiePoint[];
    roleBreakdown: AdminPiePoint[];
  };
  recentPayments: AdminPayment[];
};

type AdminLoanReview = {
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
  documents: AdminDocument[];
  payments: AdminPayment[];
};

const adminSections: AdminSection[] = ["Overview", "Users", "Loans", "Payments", "Analytics"];

const sidebarByRole: Record<string, string[]> = {
  ADMIN: ["Overview", "Users", "Loans", "Payments", "Analytics"],
  SALES: ["Borrowers", "Leads", "Follow-ups"],
  SANCTION: ["Applications", "BRE Review", "Sanction Queue"],
  DISBURSEMENT: ["Sanctioned Loans", "Disbursement Queue"],
  COLLECTION: ["Collections", "Repayments", "Loan Closure"],
  BORROWER: ["My Loans", "Documents", "Payments"],
};

const borrowerRuleCards = [
  { title: "Keep documents ready", description: "PAN, salary slip, address proof, and bank details speed up approval.", icon: FileText },
  { title: "Maintain credit hygiene", description: "Avoid missed payments and keep your debt-to-income ratio healthy.", icon: ShieldCheck },
  { title: "Check status regularly", description: "Applications can move from pending to approved, disbursed, rejected, or closed.", icon: Clock3 },
  { title: "Apply with accuracy", description: "Use the same phone, email, and profile details across all steps.", icon: Landmark },
];

function statusLabel(status: string) {
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

function statusClass(status: string) {
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

function loanCode(id: string) {
  return `LN-${id.slice(-6).toUpperCase()}`;
}

export function AdminDashboard() {
  const auth = useAuthStore();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("Overview");
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalLoans, setTotalLoans] = useState(0);
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null);
  const [selectedLoanReview, setSelectedLoanReview] = useState<AdminLoanReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [sanctionNotes, setSanctionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userRole, setUserRole] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(8);
  const [totalUsers, setTotalUsers] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentQuery, setPaymentQuery] = useState("");
  const [paymentLoanStatus, setPaymentLoanStatus] = useState("ALL");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit] = useState(10);
  const [totalPayments, setTotalPayments] = useState(0);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [outstandingLoans, setOutstandingLoans] = useState<AdminLoan[]>([]);
  const [outstandingLoading, setOutstandingLoading] = useState(false);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);

  const role = auth.user?.role ?? "ADMIN";

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore server errors and proceed with local logout
    } finally {
      auth.logout();
      if (typeof window !== "undefined") window.location.href = "/login";
      else router.replace("/login");
    }
  };

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await api.get("/admin/dashboard/profile");
      setProfile(response.data.data ?? null);
    } catch (error: any) {
      setProfileError(error.response?.data?.message ?? "Unable to load admin profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await api.get("/admin/dashboard");
      setDashboard(response.data.data ?? null);
    } catch (error: any) {
      setDashboardError(error.response?.data?.message ?? "Unable to load admin dashboard");
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadOutstandingLoans = async () => {
    setOutstandingLoading(true);
    setOutstandingError(null);
    try {
      const response = await api.get("/dashboard/collection/loans", { params: { page: 1, limit: 6 } });
      setOutstandingLoans(response.data.data ?? []);
    } catch (error: any) {
      setOutstandingError(error.response?.data?.message ?? "Unable to load outstanding loans");
    } finally {
      setOutstandingLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const response = await api.get("/admin/dashboard/analytics");
      setAnalytics(response.data.data ?? null);
    } catch (error: any) {
      setAnalyticsError(error.response?.data?.message ?? "Unable to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadLoans = async () => {
    setLoansLoading(true);
    setLoansError(null);
    try {
      const response = await api.get("/admin/loans", {
        params: {
          page,
          limit,
          status,
          search: query.trim() || undefined,
        },
      });
      setLoans(response.data.data ?? []);
      setTotalLoans(Number(response.data.meta?.total ?? 0));
    } catch (error: any) {
      setLoansError(error.response?.data?.message ?? "Unable to load loan records");
    } finally {
      setLoansLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await api.get("/admin/users", {
        params: {
          page: userPage,
          limit: userLimit,
          search: userQuery.trim() || undefined,
          role: userRole,
        },
      });
      setUsers(response.data.data ?? []);
      setTotalUsers(Number(response.data.meta?.total ?? 0));
    } catch (error: any) {
      setUsersError(error.response?.data?.message ?? "Unable to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const response = await api.get("/admin/dashboard/payments", {
        params: {
          page: paymentPage,
          limit: paymentLimit,
          search: paymentQuery.trim() || undefined,
          loanStatus: paymentLoanStatus,
        },
      });
      setPayments(response.data.data ?? []);
      setTotalPayments(Number(response.data.meta?.total ?? 0));
    } catch (error: any) {
      setPaymentsError(error.response?.data?.message ?? "Unable to load payments");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadLoanReview = async (loan: AdminLoan) => {
    setSelectedLoan(loan);
    setSelectedLoanReview(null);
    setReviewLoading(true);
    setReviewError(null);
    try {
      const response = await api.get(`/admin/dashboard/loans/${loan._id}/review`);
      setSelectedLoanReview(response.data.data ?? null);
    } catch (error: any) {
      setReviewError(error.response?.data?.message ?? "Unable to load loan review");
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadProfile();
    loadOutstandingLoans();
  }, []);

  useEffect(() => {
    if (activeSection !== "Loans") return;
    const timeout = window.setTimeout(() => {
      loadLoans();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [activeSection, page, status, query]);

  useEffect(() => {
    if (activeSection !== "Users") return;
    const timeout = window.setTimeout(() => {
      loadUsers();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [activeSection, userPage, userRole, userQuery]);

  useEffect(() => {
    if (activeSection !== "Payments") return;
    const timeout = window.setTimeout(() => {
      loadPayments();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [activeSection, paymentPage, paymentLoanStatus, paymentQuery]);

  useEffect(() => {
    if (activeSection !== "Analytics") return;
    loadAnalytics();
  }, [activeSection]);

  const exportCsv = () => {
    const rows = [
      "Loan ID,Borrower,Amount,Status,Due Date",
      ...loans.map((loan) => `${loanCode(loan._id)},${loan.borrower?.name ?? "-"},${loan.amount},${loan.status},${loan.dueDate ? new Date(loan.dueDate).toISOString().slice(0, 10) : ""}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "admin-loans.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setQuery("");
    setStatus("ALL");
    setPage(1);
  };

  const resetUserFilters = () => {
    setUserQuery("");
    setUserRole("ALL");
    setUserPage(1);
  };

  const changeUserRole = async (user: AdminUser, role: string) => {
    if (user.role === role) return;
    try {
      setUpdatingUserId(user._id);
      await api.patch(`/admin/users/${user._id}/role`, { role });
      toast.success(`${user.name}'s role updated`);
      await Promise.all([loadDashboard(), loadUsers()]);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const saveLoanAction = async (action: "SANCTION" | "REJECT" | "DISBURSE" | "CLOSE") => {
    const loan = selectedLoanReview?.loan ?? selectedLoan;
    if (!loan) return;
    try {
      setSavingAction(true);
      if (action === "SANCTION") {
        if (!sanctionNotes.trim()) {
          throw new Error("Enter sanction notes before approving");
        }
        await api.patch(`/loans/${loan._id}/sanction`, { notes: sanctionNotes.trim() });
      }
      if (action === "REJECT") {
        if (!rejectionReason.trim()) {
          throw new Error("Enter a rejection reason");
        }
        await api.patch(`/loans/${loan._id}/reject`, { reason: rejectionReason.trim() });
      }
      if (action === "DISBURSE") {
        if (!transactionReference.trim()) {
          throw new Error("Enter a transaction reference");
        }
        await api.patch(`/loans/${loan._id}/disburse`, { transactionReference: transactionReference.trim() });
      }
      if (action === "CLOSE") {
        await api.patch(`/loans/${loan._id}/close`);
      }
      toast.success("Loan updated successfully");
      setSelectedLoan(null);
      setSelectedLoanReview(null);
      setSanctionNotes("");
      setRejectionReason("");
      setTransactionReference("");
      await Promise.all([loadDashboard(), loadLoans(), loadAnalytics(), loadPayments()]);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? error.message ?? "Unable to update loan");
    } finally {
      setSavingAction(false);
    }
  };

  const metrics = dashboard?.metrics ?? {
    totalLoans: 0,
    activeLoans: 0,
    closedLoans: 0,
    usersTotal: 0,
    totalDisbursed: 0,
    totalCollections: 0,
  };
  const charts = dashboard?.charts ?? {
    loanVolume: [],
    collectionsTrend: [],
    loanLifecycle: [],
    roleBreakdown: [],
  };

  const analyticsCharts = analytics?.charts ?? dashboard?.charts ?? {
    loanVolume: [],
    collectionsTrend: [],
    loanLifecycle: [],
    roleBreakdown: [],
  };
  const currentLoan = selectedLoanReview?.loan ?? selectedLoan;

  const actionCopy = useMemo(() => {
    if (!currentLoan) return null;
    if (currentLoan.status === "APPLIED") return { title: "Application decision", description: "Approve or reject this application using the current BRE and document context." };
    if (currentLoan.status === "SANCTIONED") return { title: "Disbursement step", description: "Capture the transaction reference and release the approved amount." };
    if (currentLoan.status === "DISBURSED") return { title: "Closure step", description: "Mark the loan closed once repayment obligations are complete." };
    return { title: "Loan details", description: "Review the record and history." };
  }, [currentLoan]);

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r bg-card/70 p-6 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Role</p>
            <h1 className="mt-2 text-2xl font-semibold">{role} Dashboard</h1>
          </div>
          <nav className="mt-8 space-y-2 text-sm">
            {sidebarByRole[role]?.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (adminSections.includes(item as AdminSection)) {
                    setActiveSection(item as AdminSection);
                  }
                }}
                className={`w-full rounded-xl px-4 py-3 text-left transition hover:bg-secondary ${activeSection === item ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <Card className="mt-8 border-dashed bg-secondary/30">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Live admin controls</p>
              <p className="mt-2">Search applications, review loan actions, and move records through the full lifecycle from one place.</p>
            </CardContent>
          </Card>
        </aside>

        <main className="p-4 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h2 className="text-3xl font-semibold">Operational overview</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          {dashboardLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          ) : dashboardError ? (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{dashboardError}</div>
          ) : activeSection === "Overview" ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total Loans", value: metrics.totalLoans.toLocaleString(), icon: BadgeIndianRupee },
                  { label: "Active Loans", value: metrics.activeLoans.toLocaleString(), icon: Banknote },
                  { label: "Closed Loans", value: metrics.closedLoans.toLocaleString(), icon: CircleDollarSign },
                  { label: "Users", value: metrics.usersTotal.toLocaleString(), icon: Users },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label} className="bg-card/80">
                      <CardContent className="flex items-center justify-between p-6">
                        <div>
                          <p className="text-sm text-muted-foreground">{card.label}</p>
                          <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                        </div>
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle>Loan pipeline</CardTitle>
                    <CardDescription>Monthly volume and lifecycle mix</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-8 lg:grid-cols-2">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.loanVolume}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={charts.loanLifecycle} dataKey="value" nameKey="name" outerRadius={100} label>
                            {charts.loanLifecycle.map((entry) => (
                              <Cell key={entry.name} fill={entry.color ?? "#2563eb"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle>Collections trend</CardTitle>
                    <CardDescription>Rolling repayment performance</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.collectionsTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="bg-card/80">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Outstanding Tracker</CardTitle>
                        <CardDescription>Top pending disbursed loans (live)</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => {
                          const rows = ["Loan ID,Borrower,Outstanding,Paid,Total,Status"];
                          for (const loan of outstandingLoans) {
                            rows.push(`${loanCode(loan._id)},${loan.borrower?.name ?? "-"},${loan.outstandingAmount ?? 0},${loan.paidAmount ?? 0},${loan.totalRepayment ?? 0},${loan.status}`);
                          }
                          const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = "outstanding-tracker.csv"; a.click(); URL.revokeObjectURL(url);
                        }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadOutstandingLoans}>Refresh</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {outstandingLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
                    {outstandingError ? <div className="rounded-2xl border border-rose-500/30 p-3 text-sm text-rose-700">{outstandingError}</div> : null}
                    {outstandingLoans.map((loan) => (
                      <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{loan.borrower?.name ?? "Borrower"}</p>
                          <Badge className={statusClass(loan.status)}>{statusLabel(loan.status)}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">Outstanding ₹{(loan.outstandingAmount ?? 0).toLocaleString()} · Paid ₹{(loan.paidAmount ?? 0).toLocaleString()} · Total ₹{(loan.totalRepayment ?? 0).toLocaleString()}</p>
                        <div className="mt-2 flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => loadLoanReview(loan)}>Review</Button>
                        </div>
                      </div>
                    ))}
                    {!outstandingLoans.length && !outstandingLoading ? <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No outstanding loans found.</div> : null}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle>Loan management</CardTitle>
                    <CardDescription>Search, filter, paginate, and act on live records.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-1 gap-3">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search loans, borrowers, amounts" className="pl-10" />
                        </div>
                        <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
                          <option value="ALL">All statuses</option>
                          <option value="APPLIED">APPLIED</option>
                          <option value="SANCTIONED">SANCTIONED</option>
                          <option value="DISBURSED">DISBURSED</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="REJECTED">REJECTED</option>
                        </Select>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border">
                      {loansLoading ? (
                        <div className="grid gap-3 p-6">
                          <Skeleton className="h-12 rounded-2xl" />
                          <Skeleton className="h-12 rounded-2xl" />
                          <Skeleton className="h-12 rounded-2xl" />
                        </div>
                      ) : loansError ? (
                        <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{loansError}</div>
                      ) : loans.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Loan ID</TableHead>
                              <TableHead>Borrower</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loans.map((loan) => (
                              <TableRow key={loan._id}>
                                <TableCell>{loanCode(loan._id)}</TableCell>
                                <TableCell>
                                  <div className="grid">
                                    <span className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</span>
                                    <span className="text-xs text-muted-foreground">{loan.borrower?.email ?? "No email"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>₹{loan.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge className={statusClass(loan.status)}>{loan.status}</Badge>
                                </TableCell>
                                <TableCell>{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedLoan(loan)}>
                                    Review
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="grid gap-3 p-10 text-center">
                          <Skeleton className="mx-auto h-14 w-14 rounded-full" />
                          <p className="font-medium">No loans match the current filters.</p>
                          <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different status.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Showing {totalLoans ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalLoans)} of {totalLoans}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage((current) => (current * limit < totalLoans ? current + 1 : current))} disabled={page * limit >= totalLoans}>Next</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle>Role mix</CardTitle>
                    <CardDescription>Internal user distribution across the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={charts.roleBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                            {charts.roleBreakdown.map((entry, index) => (
                              <Cell key={entry.name} fill={["#0f172a", "#2563eb", "#10b981", "#f59e0b", "#ec4899", "#94a3b8"][index % 6]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid gap-3">
                      {dashboard?.recentLoans?.slice(0, 4).map((loan) => (
                        <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</p>
                              <p className="text-xs text-muted-foreground">{loanCode(loan._id)} · {loan.status}</p>
                            </div>
                            <Badge className={statusClass(loan.status)}>{statusLabel(loan.status)}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">₹{loan.amount.toLocaleString()} · {loan.tenure} days · Due {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Card className="bg-card/80">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>User management</CardTitle>
                        <CardDescription>Search accounts, review contact verification, and assign roles.</CardDescription>
                      </div>
                      <Button variant="outline" onClick={resetUserFilters}>
                        <Filter className="h-4 w-4" />
                        Clear filters
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-1 gap-3">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input value={userQuery} onChange={(event) => { setUserPage(1); setUserQuery(event.target.value); }} placeholder="Search users by name, email, or phone" className="pl-10" />
                        </div>
                        <Select value={userRole} onChange={(event) => { setUserPage(1); setUserRole(event.target.value); }}>
                          <option value="ALL">All roles</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SALES">SALES</option>
                          <option value="SANCTION">SANCTION</option>
                          <option value="DISBURSEMENT">DISBURSEMENT</option>
                          <option value="COLLECTION">COLLECTION</option>
                          <option value="BORROWER">BORROWER</option>
                        </Select>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border">
                      {usersLoading ? (
                        <div className="grid gap-3 p-6">
                          <Skeleton className="h-12 rounded-2xl" />
                          <Skeleton className="h-12 rounded-2xl" />
                          <Skeleton className="h-12 rounded-2xl" />
                        </div>
                      ) : usersError ? (
                        <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{usersError}</div>
                      ) : users.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user._id}>
                                <TableCell>
                                  <div className="grid">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="grid text-sm">
                                    <span>{user.phone}</span>
                                    <span className="text-xs text-muted-foreground">{user.secondaryEmail ?? "No secondary email"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className={user.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-700"}>
                                      {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Badge className={user.phoneVerifiedAt ? "bg-blue-500/10 text-blue-700" : "bg-amber-500/10 text-amber-700"}>
                                      {user.phoneVerifiedAt ? "Phone verified" : "Phone pending"}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select value={user.role} onChange={(event) => changeUserRole(user, event.target.value)} disabled={updatingUserId === user._id}>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SALES">SALES</option>
                                    <option value="SANCTION">SANCTION</option>
                                    <option value="DISBURSEMENT">DISBURSEMENT</option>
                                    <option value="COLLECTION">COLLECTION</option>
                                    <option value="BORROWER">BORROWER</option>
                                  </Select>
                                </TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => toast.info(`${user.name} is ${user.isActive ? "active" : "inactive"}`)}>
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="grid gap-3 p-10 text-center">
                          <Skeleton className="mx-auto h-14 w-14 rounded-full" />
                          <p className="font-medium">No users match the current filters.</p>
                          <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different role.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Showing {totalUsers ? (userPage - 1) * userLimit + 1 : 0}-{Math.min(userPage * userLimit, totalUsers)} of {totalUsers}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setUserPage((current) => Math.max(current - 1, 1))} disabled={userPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setUserPage((current) => (current * userLimit < totalUsers ? current + 1 : current))} disabled={userPage * userLimit >= totalUsers}>Next</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle>Admin profile</CardTitle>
                    <CardDescription>Profile and verification details for the signed-in administrator.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {profileLoading ? (
                      <div className="grid gap-3">
                        <Skeleton className="h-12 rounded-2xl" />
                        <Skeleton className="h-12 rounded-2xl" />
                        <Skeleton className="h-12 rounded-2xl" />
                      </div>
                    ) : profileError ? (
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-rose-700">{profileError}</div>
                    ) : profile ? (
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/20 px-4 py-3">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{profile.name}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/20 px-4 py-3">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium">{profile.email}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-secondary/20 px-4 py-3">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium">{profile.phone}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={profile.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-700"}>
                            {profile.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge className="bg-blue-500/10 text-blue-700">{profile.role}</Badge>
                          <Badge className={profile.phoneVerifiedAt ? "bg-blue-500/10 text-blue-700" : "bg-amber-500/10 text-amber-700"}>
                            {profile.phoneVerifiedAt ? "Phone verified" : "Phone pending"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed p-4 text-muted-foreground">No admin profile loaded.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle>Section navigator</CardTitle>
                    <CardDescription>Jump to the operational panel you want to manage.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {adminSections.map((section) => (
                      <Button key={section} type="button" variant={activeSection === section ? "default" : "outline"} onClick={() => setActiveSection(section)}>
                        {section}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {activeSection === "Users" ? (
                <div className="mt-6">
                  <Card className="bg-card/80">
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle>User management</CardTitle>
                          <CardDescription>Search accounts, review contact verification, and assign roles.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={resetUserFilters}>
                          <Filter className="h-4 w-4" />
                          Clear filters
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 gap-3">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={userQuery} onChange={(event) => { setUserPage(1); setUserQuery(event.target.value); }} placeholder="Search users by name, email, or phone" className="pl-10" />
                          </div>
                          <Select value={userRole} onChange={(event) => { setUserPage(1); setUserRole(event.target.value); }}>
                            <option value="ALL">All roles</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SALES">SALES</option>
                            <option value="SANCTION">SANCTION</option>
                            <option value="DISBURSEMENT">DISBURSEMENT</option>
                            <option value="COLLECTION">COLLECTION</option>
                            <option value="BORROWER">BORROWER</option>
                          </Select>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border">
                        {usersLoading ? (
                          <div className="grid gap-3 p-6">
                            <Skeleton className="h-12 rounded-2xl" />
                            <Skeleton className="h-12 rounded-2xl" />
                            <Skeleton className="h-12 rounded-2xl" />
                          </div>
                        ) : usersError ? (
                          <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{usersError}</div>
                        ) : users.length ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.map((user) => (
                                <TableRow key={user._id}>
                                  <TableCell>
                                    <div className="grid">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="grid text-sm">
                                      <span>{user.phone}</span>
                                      <span className="text-xs text-muted-foreground">{user.secondaryEmail ?? "No secondary email"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge className={user.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-700"}>
                                        {user.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                      <Badge className={user.phoneVerifiedAt ? "bg-blue-500/10 text-blue-700" : "bg-amber-500/10 text-amber-700"}>
                                        {user.phoneVerifiedAt ? "Phone verified" : "Phone pending"}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select value={user.role} onChange={(event) => changeUserRole(user, event.target.value)} disabled={updatingUserId === user._id}>
                                      <option value="ADMIN">ADMIN</option>
                                      <option value="SALES">SALES</option>
                                      <option value="SANCTION">SANCTION</option>
                                      <option value="DISBURSEMENT">DISBURSEMENT</option>
                                      <option value="COLLECTION">COLLECTION</option>
                                      <option value="BORROWER">BORROWER</option>
                                    </Select>
                                  </TableCell>
                                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => toast.info(`${user.name} is ${user.isActive ? "active" : "inactive"}`)}>
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="grid gap-3 p-10 text-center">
                            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
                            <p className="font-medium">No users match the current filters.</p>
                            <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different role.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Showing {totalUsers ? (userPage - 1) * userLimit + 1 : 0}-{Math.min(userPage * userLimit, totalUsers)} of {totalUsers}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setUserPage((current) => Math.max(current - 1, 1))} disabled={userPage === 1}>Previous</Button>
                          <Button variant="outline" size="sm" onClick={() => setUserPage((current) => (current * userLimit < totalUsers ? current + 1 : current))} disabled={userPage * userLimit >= totalUsers}>Next</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {activeSection === "Loans" ? (
                <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="bg-card/80">
                    <CardHeader>
                      <CardTitle>Loan management</CardTitle>
                      <CardDescription>Search, filter, paginate, and review applications with uploaded files.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 gap-3">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search loans, borrowers, amounts" className="pl-10" />
                          </div>
                          <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
                            <option value="ALL">All statuses</option>
                            <option value="APPLIED">APPLIED</option>
                            <option value="SANCTIONED">SANCTIONED</option>
                            <option value="DISBURSED">DISBURSED</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="REJECTED">REJECTED</option>
                          </Select>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border">
                        {loansLoading ? (
                          <div className="grid gap-3 p-6">
                            <Skeleton className="h-12 rounded-2xl" />
                            <Skeleton className="h-12 rounded-2xl" />
                            <Skeleton className="h-12 rounded-2xl" />
                          </div>
                        ) : loansError ? (
                          <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{loansError}</div>
                        ) : loans.length ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Loan ID</TableHead>
                                <TableHead>Borrower</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loans.map((loan) => (
                                <TableRow key={loan._id}>
                                  <TableCell>{loanCode(loan._id)}</TableCell>
                                  <TableCell>
                                    <div className="grid">
                                      <span className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</span>
                                      <span className="text-xs text-muted-foreground">{loan.borrower?.email ?? "No email"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>₹{loan.amount.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge className={statusClass(loan.status)}>{loan.status}</Badge>
                                  </TableCell>
                                  <TableCell>{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => loadLoanReview(loan)}>
                                      Review
                                      <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="grid gap-3 p-10 text-center">
                            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
                            <p className="font-medium">No loans match the current filters.</p>
                            <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different status.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Showing {totalLoans ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalLoans)} of {totalLoans}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1}>Previous</Button>
                          <Button variant="outline" size="sm" onClick={() => setPage((current) => (current * limit < totalLoans ? current + 1 : current))} disabled={page * limit >= totalLoans}>Next</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/80">
                    <CardHeader>
                      <CardTitle>Loan funnel</CardTitle>
                      <CardDescription>Role mix and recent activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={analyticsCharts.roleBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                              {analyticsCharts.roleBreakdown.map((entry, index) => (
                                <Cell key={entry.name} fill={entry.color ?? ["#0f172a", "#2563eb", "#10b981", "#f59e0b", "#ec4899", "#94a3b8"][index % 6]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid gap-3">
                        {dashboard?.recentLoans?.slice(0, 4).map((loan) => (
                          <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</p>
                                <p className="text-xs text-muted-foreground">{loanCode(loan._id)} · {loan.status}</p>
                              </div>
                              <Badge className={statusClass(loan.status)}>{statusLabel(loan.status)}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">₹{loan.amount.toLocaleString()} · {loan.tenure} days · Due {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {activeSection === "Payments" ? (
                <div className="mt-6">
                  <Card className="bg-card/80">
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle>Payment management</CardTitle>
                          <CardDescription>Search repayments, filter by loan status, and review collector details.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => {
                          setPaymentQuery("");
                          setPaymentLoanStatus("ALL");
                          setPaymentPage(1);
                        }}>
                          <Filter className="h-4 w-4" />
                          Clear filters
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 gap-3">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={paymentQuery} onChange={(event) => { setPaymentPage(1); setPaymentQuery(event.target.value); }} placeholder="Search UTR, borrower, or loan status" className="pl-10" />
                          </div>
                          <Select value={paymentLoanStatus} onChange={(event) => { setPaymentPage(1); setPaymentLoanStatus(event.target.value); }}>
                            <option value="ALL">All loan statuses</option>
                            <option value="APPLIED">APPLIED</option>
                            <option value="SANCTIONED">SANCTIONED</option>
                            <option value="DISBURSED">DISBURSED</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="REJECTED">REJECTED</option>
                          </Select>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border">
                        {paymentsLoading ? (
                          <div className="grid gap-3 p-6">
                            <Skeleton className="h-12 rounded-2xl" />
                            <Skeleton className="h-12 rounded-2xl" />
                            <Skeleton className="h-12 rounded-2xl" />
                          </div>
                        ) : paymentsError ? (
                          <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{paymentsError}</div>
                        ) : payments.length ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Payment</TableHead>
                                <TableHead>Loan</TableHead>
                                <TableHead>Borrower</TableHead>
                                <TableHead>Collector</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payments.map((payment) => (
                                <TableRow key={payment._id}>
                                  <TableCell>
                                    <div className="grid">
                                      <span className="font-medium">{payment.utrNumber}</span>
                                      <span className="text-xs text-muted-foreground">{payment._id.slice(-8)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{payment.loan?._id ? loanCode(payment.loan._id) : "-"}</TableCell>
                                  <TableCell>{payment.borrower?.name ?? payment.borrower?.email ?? "-"}</TableCell>
                                  <TableCell>{payment.collector?.name ?? payment.collector?.email ?? "-"}</TableCell>
                                  <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="grid gap-3 p-10 text-center">
                            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
                            <p className="font-medium">No payments match the current filters.</p>
                            <p className="text-sm text-muted-foreground">Try a different search or loan status.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Showing {totalPayments ? (paymentPage - 1) * paymentLimit + 1 : 0}-{Math.min(paymentPage * paymentLimit, totalPayments)} of {totalPayments}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPaymentPage((current) => Math.max(current - 1, 1))} disabled={paymentPage === 1}>Previous</Button>
                          <Button variant="outline" size="sm" onClick={() => setPaymentPage((current) => (current * paymentLimit < totalPayments ? current + 1 : current))} disabled={paymentPage * paymentLimit >= totalPayments}>Next</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {activeSection === "Analytics" ? (
                <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <Card className="bg-card/80">
                    <CardHeader>
                      <CardTitle>Analytics</CardTitle>
                      <CardDescription>Volume, collections, and lifecycle trends.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8 lg:grid-cols-2">
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsCharts.loanVolume}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={analyticsCharts.loanLifecycle} dataKey="value" nameKey="name" outerRadius={100} label>
                              {analyticsCharts.loanLifecycle.map((entry) => (
                                <Cell key={entry.name} fill={entry.color ?? "#2563eb"} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/80">
                    <CardHeader>
                      <CardTitle>Recent payments</CardTitle>
                      <CardDescription>Most recent collections coming through the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsLoading ? (
                        <div className="grid gap-3">
                          <Skeleton className="h-16 rounded-2xl" />
                          <Skeleton className="h-16 rounded-2xl" />
                          <Skeleton className="h-16 rounded-2xl" />
                        </div>
                      ) : analyticsError ? (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-rose-700">{analyticsError}</div>
                      ) : analytics?.recentPayments?.length ? (
                        analytics.recentPayments.map((payment) => (
                          <div key={payment._id} className="rounded-2xl border bg-secondary/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{payment.utrNumber}</p>
                                <p className="text-xs text-muted-foreground">{payment.loan?.status ?? "Loan"}</p>
                              </div>
                              <Badge className="bg-blue-500/10 text-blue-700">₹{payment.amount.toLocaleString()}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{payment.collector?.name ?? "Collector"} · {new Date(payment.paymentDate).toLocaleDateString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No payment analytics yet.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>

      <Dialog
        open={Boolean(selectedLoan)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLoan(null);
            setSelectedLoanReview(null);
            setReviewError(null);
            setSanctionNotes("");
            setRejectionReason("");
            setTransactionReference("");
          }
        }}
        contentClassName="max-w-5xl p-0"
      >
        {currentLoan ? (
          <div className="flex max-h-[90vh] flex-col overflow-hidden">
            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 px-6 py-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Loan Review</p>
                  <h3 className="mt-2 text-2xl font-semibold">{loanCode(currentLoan._id)}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/75">{actionCopy?.description}</p>
                </div>
                <Badge className={statusClass(currentLoan.status)}>{statusLabel(currentLoan.status)}</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Requested</p>
                  <p className="mt-2 text-lg font-semibold">₹{currentLoan.amount.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Tenure</p>
                  <p className="mt-2 text-lg font-semibold">{currentLoan.tenure} days</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Outstanding</p>
                  <p className="mt-2 text-lg font-semibold">₹{currentLoan.outstandingAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Paid</p>
                  <p className="mt-2 text-lg font-semibold">₹{currentLoan.paidAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(90vh-250px)] overflow-y-auto px-6 py-6">
              {reviewLoading ? <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-blue-700">Loading loan review details...</div> : null}
              {reviewError ? <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700">{reviewError}</div> : null}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Borrower snapshot</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selectedLoanReview?.borrower?.name ?? currentLoan.borrower?.name ?? "Unknown"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedLoanReview?.borrower?.email ?? currentLoan.borrower?.email ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedLoanReview?.borrower?.phone ?? currentLoan.borrower?.phone ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium">{selectedLoanReview?.borrower?.role ?? currentLoan.borrower?.role ?? "BORROWER"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Amount breakdown</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Interest</span>
                      <span className="font-medium">₹{currentLoan.interestAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Total Repayment</span>
                      <span className="font-medium">₹{currentLoan.totalRepayment.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-medium break-all text-right">{currentLoan.transactionReference ?? "Not generated yet"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-background p-4 lg:col-span-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Action workspace</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-secondary/20 p-4 md:col-span-2">
                      {currentLoan.status === "APPLIED" ? (
                        <div className="grid gap-3">
                          <div>
                            <p className="text-sm font-medium">Approve this application</p>
                            <p className="text-xs text-muted-foreground">Add sanction notes so the borrower and collection teams can trace the decision.</p>
                          </div>
                          <Textarea value={sanctionNotes} onChange={(event) => setSanctionNotes(event.target.value)} placeholder="Sanction notes" />
                          <div>
                            <p className="text-sm font-medium">Reject with reason</p>
                            <p className="text-xs text-muted-foreground">A specific rejection note keeps the workflow transparent.</p>
                          </div>
                          <Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Rejection reason" />
                        </div>
                      ) : currentLoan.status === "SANCTIONED" ? (
                        <div className="grid gap-3">
                          <div>
                            <p className="text-sm font-medium">Disburse approved funds</p>
                            <p className="text-xs text-muted-foreground">Capture the bank transfer reference before completing disbursement.</p>
                          </div>
                          <Input value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="Transaction reference" />
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          <p className="text-sm font-medium">Loan history</p>
                          <p className="text-sm text-muted-foreground">This record is in a terminal state. Use the details above to audit the lifecycle or cross-check repayment history.</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-secondary/20 p-4">
                      <p className="text-sm font-medium">Quick facts</p>
                      <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between gap-3">
                          <span>Applied on</span>
                          <span className="font-medium text-foreground">{new Date(currentLoan.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Due date</span>
                          <span className="font-medium text-foreground">{currentLoan.dueDate ? new Date(currentLoan.dueDate).toLocaleDateString() : "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Updated</span>
                          <span className="font-medium text-foreground">{new Date(currentLoan.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-background p-4 lg:col-span-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Uploaded documents</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {selectedLoanReview?.documents?.length ? selectedLoanReview.documents.map((document) => (
                      <a key={document._id} href={resolveFileUrl(document.fileUrl)} target="_blank" rel="noreferrer" className="rounded-xl border bg-secondary/20 p-4 transition hover:bg-secondary/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{document.fileType}</p>
                            <p className="text-xs text-muted-foreground">Uploaded {new Date(document.uploadedAt).toLocaleString()}</p>
                          </div>
                          <Badge className="bg-blue-500/10 text-blue-700">Open</Badge>
                        </div>
                        <p className="mt-3 break-all text-xs text-muted-foreground">{document.fileUrl}</p>
                      </a>
                    )) : (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">No uploaded documents found for this borrower.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-background p-4 lg:col-span-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Repayment history</p>
                  <div className="mt-4 overflow-hidden rounded-2xl border">
                    {selectedLoanReview?.payments?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>UTR</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLoanReview.payments.map((payment) => (
                            <TableRow key={payment._id}>
                              <TableCell>{payment.utrNumber}</TableCell>
                              <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                              <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">No repayments recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t bg-background px-6 py-4">
              <div className="mr-auto text-xs text-muted-foreground">Use the action buttons to push the loan through the lifecycle.</div>
              {currentLoan.status === "APPLIED" ? (
                <>
                  <Button variant="destructive" onClick={() => saveLoanAction("REJECT")} disabled={savingAction}>Reject</Button>
                  <Button onClick={() => saveLoanAction("SANCTION")} disabled={savingAction}>Approve</Button>
                </>
              ) : null}
              {currentLoan.status === "SANCTIONED" ? <Button onClick={() => saveLoanAction("DISBURSE")} disabled={savingAction}>Disburse</Button> : null}
              {currentLoan.status === "DISBURSED" ? <Button onClick={() => saveLoanAction("CLOSE")} disabled={savingAction}>Close Loan</Button> : null}
              <Button variant="outline" onClick={() => setSelectedLoan(null)}>Close</Button>
            </DialogFooter>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

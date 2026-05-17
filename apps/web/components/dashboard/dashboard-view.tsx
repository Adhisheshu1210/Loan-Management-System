"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeIndianRupee, Banknote, CircleDollarSign, FileText, Landmark, ShieldCheck, Sparkles, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type BorrowerLoan = {
  _id: string;
  amount: number;
  status: string;
  dueDate?: string | null;
  createdAt: string;
};

type BorrowerDocument = {
  _id: string;
  fileType: string;
  uploadedAt: string;
};

type BorrowerPayment = {
  _id: string;
  amount: number;
  utrNumber: string;
  paymentDate: string;
};

type BorrowerDashboardData = {
  loans: BorrowerLoan[];
  documents: BorrowerDocument[];
  payments: BorrowerPayment[];
  summary: {
    totalApplications: number;
    pending: number;
    withdrawn: number;
    approved: number;
    disbursed: number;
    rejected: number;
    closed: number;
    appliedValue: number;
  };
};

const guidanceCards = [
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

function BorrowerDashboard() {
  const router = useRouter();
  const auth = useAuthStore();
  const [dashboard, setDashboard] = useState<BorrowerDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.get("/borrower/dashboard")
      .then((response) => {
        if (!active) return;
        setDashboard(response.data.data ?? null);
      })
      .catch((caughtError: any) => {
        if (!active) return;
        setError(caughtError.response?.data?.message ?? "Unable to load borrower dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Local logout still proceeds if the server session is already gone.
    } finally {
      auth.logout();
      router.push("/login");
    }
  };

  const loans = dashboard?.loans ?? [];
  const documents = dashboard?.documents ?? [];
  const payments = dashboard?.payments ?? [];
  const summary = dashboard?.summary ?? {
    totalApplications: 0,
    pending: 0,
    withdrawn: 0,
    approved: 0,
    disbursed: 0,
    rejected: 0,
    closed: 0,
    appliedValue: 0,
  };
  const latestLoan = loans[0] ?? null;
  const activeCount = summary.pending + summary.approved + summary.disbursed;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.9),rgba(16,185,129,0.78))] text-white shadow-soft">
            <CardContent className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Borrower dashboard
                </div>
                <h1 className="mt-5 text-3xl font-semibold md:text-5xl">Track applications, approvals, and repayments in one place.</h1>
                <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">
                  See every loan you applied for, review the current status, and manage your borrower profile from one polished dashboard.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-white/90">
                    <Link href="/borrower/apply">
                      Apply for Loan
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10">
                    <Link href="/borrower/profile">Profile</Link>
                  </Button>
                  <Button type="button" variant="outline" onClick={handleLogout} className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10">
                    Logout
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Applications", value: summary.totalApplications.toString() },
                  { label: "Active", value: activeCount.toString() },
                  { label: "Rejected", value: summary.rejected.toString() },
                  { label: "Applied Value", value: `₹${summary.appliedValue.toLocaleString()}` },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/60">{card.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-card/90 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle>Borrower guidance</CardTitle>
              <CardDescription>These checkpoints reduce avoidable delays and rejections.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {guidanceCards.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="flex gap-3 rounded-2xl border bg-secondary/30 p-4">
                    <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{rule.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden bg-card/80">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Loan history</CardTitle>
                  <CardDescription>Click a row to review the latest status and due date.</CardDescription>
                </div>
                <Badge className="bg-secondary">{loans.length} records</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="grid gap-3">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{error}</div>
              ) : loans.length ? (
                <div className="grid gap-3">
                  {loans.map((loan) => (
                    <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4 transition hover:border-primary/40 hover:bg-secondary/40">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Loan #{loan._id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">Applied {new Date(loan.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge className={statusClass(loan.status)}>{statusLabel(loan.status)}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>Amount: ₹{loan.amount.toLocaleString()}</span>
                        <span>Due: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 rounded-2xl border border-dashed p-10 text-center">
                  <p className="font-medium">No loan applications yet.</p>
                  <p className="text-sm text-muted-foreground">Start your first application to track status here.</p>
                  <Button asChild className="mx-auto mt-2 w-fit">
                    <Link href="/borrower/apply">Apply Now</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Application summary</CardTitle>
              <CardDescription>Quick status, next step, and recent activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Current status</p>
                <p className="mt-2 text-lg font-medium">{latestLoan ? statusLabel(latestLoan.status) : "No submissions yet"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Latest application date</p>
                <p className="mt-2 text-lg font-medium">{latestLoan ? new Date(latestLoan.createdAt).toLocaleString() : "-"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Latest due date</p>
                <p className="mt-2 text-lg font-medium">{latestLoan?.dueDate ? new Date(latestLoan.dueDate).toLocaleDateString() : "-"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Uploaded documents</p>
                <p className="mt-2 text-lg font-medium">{documents.length} file{documents.length === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-muted-foreground">Payment records</p>
                <p className="mt-2 text-lg font-medium">{payments.length} entry{payments.length === 1 ? "" : "ies"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Uploaded documents</CardTitle>
              <CardDescription>Salary slips and related files attached to your profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {documents.length ? documents.map((document) => (
                <div key={document._id} className="rounded-2xl border bg-secondary/20 p-4">
                  <p className="font-medium">{document.fileType}</p>
                  <p className="text-xs text-muted-foreground">Uploaded {new Date(document.uploadedAt).toLocaleString()}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No uploaded documents yet.</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>Recent repayments and collected amounts for your loans.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {payments.length ? payments.map((payment) => (
                <div key={payment._id} className="rounded-2xl border bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                    <Badge className="bg-secondary">{new Date(payment.paymentDate).toLocaleDateString()}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">UTR: {payment.utrNumber}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No payment history yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  const role = useAuthStore((state) => state.user?.role ?? "BORROWER");
  return role === "ADMIN" ? <AdminDashboard /> : <BorrowerDashboard />;
}

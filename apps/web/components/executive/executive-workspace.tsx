"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Banknote, LogOut, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION";

type WorkspaceResponse = {
  role: Role;
  summary: Record<string, number>;
  leads?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    profileReady: boolean;
  }>;
  loans?: Array<{
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
    borrowerId?: { name?: string; email?: string; phone?: string } | null;
    sanctionedBy?: { name?: string; email?: string; phone?: string } | null;
    disbursedBy?: { name?: string; email?: string; phone?: string } | null;
  }>;
  recentPayments?: Array<{
    _id: string;
    amount: number;
    utrNumber: string;
    paymentDate: string;
    createdAt: string;
    loanId?: {
      _id?: string;
      status?: string;
      amount?: number;
      outstandingAmount?: number;
      borrowerId?: { name?: string; email?: string; phone?: string } | null;
    } | null;
    collectedBy?: { name?: string; email?: string; phone?: string } | null;
  }>;
};

type ProfileData = {
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

const roleConfig: Record<Role, { title: string; eyebrow: string; description: string; accent: string; homeLabel: string }> = {
  SALES: {
    title: "Sales workspace",
    eyebrow: "Lead tracking",
    description: "Track registered borrowers who have not applied yet and keep the lead pipeline warm.",
    accent: "from-amber-600 via-orange-500 to-rose-500",
    homeLabel: "Sales home",
  },
  SANCTION: {
    title: "Sanction workspace",
    eyebrow: "Approval review",
    description: "Review APPLIED loans, approve qualified files, or reject them with a reason.",
    accent: "from-emerald-600 via-teal-500 to-cyan-500",
    homeLabel: "Sanction home",
  },
  DISBURSEMENT: {
    title: "Disbursement workspace",
    eyebrow: "Funds release",
    description: "Move sanctioned loans to disbursed once reference details are captured.",
    accent: "from-blue-600 via-indigo-500 to-violet-500",
    homeLabel: "Disbursement home",
  },
  COLLECTION: {
    title: "Collection workspace",
    eyebrow: "Repayment control",
    description: "Record payments against disbursed loans and let the backend auto-close fully paid accounts.",
    accent: "from-slate-700 via-slate-600 to-cyan-700",
    homeLabel: "Collection home",
  },
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function displayName(user?: { name?: string } | null) {
  return user?.name ?? "Unassigned";
}

function displayDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function displayDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function ExecutiveWorkspacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const routeRole = useMemo(() => {
    if (pathname.startsWith("/sanction")) return "SANCTION" as const;
    if (pathname.startsWith("/disbursement")) return "DISBURSEMENT" as const;
    if (pathname.startsWith("/collection")) return "COLLECTION" as const;
    return "SALES" as const;
  }, [pathname]);
  const role = ((auth.user?.role as Role | undefined) ?? routeRole) as Role;
  const config = roleConfig[role];

  const loadWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/dashboard/workspace");
      setWorkspace(response.data.data ?? null);
    } catch (caughtError: any) {
      setError(caughtError.response?.data?.message ?? "Unable to load workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    api.get("/auth/me")
      .then((response) => {
        const user = response.data.data?.user;
        if (user) {
          auth.setAuth(user, null);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [auth, router]);

  useEffect(() => {
    if (!mounted || !auth.user?.role) return;
    if (!["SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"].includes(auth.user.role)) {
      router.replace("/unauthorized");
      return;
    }
    loadWorkspace();
  }, [auth.user?.role, mounted]);

  const summaryCards = useMemo(() => {
    const summary = workspace?.summary ?? {};
    if (role === "SALES") {
      return [
        { label: "Total leads", value: summary.totalLeads ?? 0 },
        { label: "Profile ready", value: summary.profileReady ?? 0 },
        { label: "Unengaged", value: summary.unengagedLeads ?? 0 },
      ];
    }
    if (role === "SANCTION") {
      return [
        { label: "Pending applications", value: summary.pendingApplications ?? 0 },
        { label: "Total requested", value: summary.totalRequested ?? 0, currency: true },
        { label: "Average requested", value: summary.averageRequested ?? 0, currency: true },
      ];
    }
    if (role === "DISBURSEMENT") {
      return [
        { label: "Sanctioned loans", value: summary.sanctionedLoans ?? 0 },
        { label: "Sanctioned amount", value: summary.sanctionedAmount ?? 0, currency: true },
        { label: "Ready to disburse", value: summary.readyToDisburse ?? 0 },
      ];
    }
    return [
      { label: "Active loans", value: summary.activeLoans ?? 0 },
      { label: "Outstanding", value: summary.outstandingAmount ?? 0, currency: true },
      { label: "Recent payments", value: summary.recentPayments ?? 0 },
    ];
  }, [role, workspace?.summary]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // proceed with local logout
    } finally {
      auth.logout();
      router.replace("/login");
    }
  };

  const handleSanction = async (loanId: string) => {
    const notes = window.prompt("Enter sanction notes (optional)")?.trim() || undefined;
    try {
      setBusyId(loanId);
      await api.patch(`/loans/${loanId}/sanction`, { notes });
      toast.success("Loan sanctioned");
      await loadWorkspace();
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? "Unable to sanction loan");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (loanId: string) => {
    const reason = window.prompt("Enter rejection reason")?.trim();
    if (!reason) return;
    try {
      setBusyId(loanId);
      await api.patch(`/loans/${loanId}/reject`, { reason });
      toast.success("Loan rejected");
      await loadWorkspace();
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? "Unable to reject loan");
    } finally {
      setBusyId(null);
    }
  };

  const handleDisburse = async (loanId: string) => {
    const transactionReference = window.prompt("Enter transaction reference")?.trim();
    if (!transactionReference) return;
    const proofUrl = window.prompt("Enter proof URL (optional)")?.trim() || undefined;
    try {
      setBusyId(loanId);
      await api.patch(`/loans/${loanId}/disburse`, { transactionReference, proofUrl });
      toast.success("Loan disbursed");
      await loadWorkspace();
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? "Unable to disburse loan");
    } finally {
      setBusyId(null);
    }
  };

  const handlePayment = async (loanId: string, outstandingAmount: number) => {
    const amountText = window.prompt(`Enter payment amount (max ${outstandingAmount})`);
    const amount = Number(amountText);
    const utrNumber = window.prompt("Enter unique UTR number")?.trim();
    const paymentDate = window.prompt("Enter payment date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10))?.trim();
    if (!amountText || Number.isNaN(amount) || amount <= 0 || amount > outstandingAmount || !utrNumber || !paymentDate) return;
    try {
      setBusyId(loanId);
      await api.post("/payments", { loanId, amount, utrNumber, paymentDate });
      toast.success("Payment recorded");
      await loadWorkspace();
    } catch (caughtError: any) {
      toast.error(caughtError.response?.data?.message ?? "Unable to record payment");
    } finally {
      setBusyId(null);
    }
  };

  const loans = workspace?.loans ?? [];
  const leads = workspace?.leads ?? [];
  const recentPayments = workspace?.recentPayments ?? [];

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.96))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">{config.eyebrow}</p>
            <h1 className="mt-1 text-lg font-semibold md:text-2xl">{config.title}</h1>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border bg-background/75 px-3 py-2 text-sm md:flex">
            <UserCircle2 className="h-4 w-4" />
            <span className="font-medium">{auth.user?.name ?? role}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="bg-background/80">
              <Link href={`/${role.toLowerCase()}/profile`}>Profile</Link>
            </Button>
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4 md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            {config.homeLabel}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <section className={`rounded-[30px] bg-gradient-to-br ${config.accent} p-[1px] shadow-soft`}>
          <div className="grid gap-6 rounded-[29px] bg-slate-950 px-6 py-8 text-white md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">{config.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold md:text-5xl">{config.title}</h2>
              <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">{config.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-white/90">
                  <Link href={`/${role.toLowerCase()}/profile`}>
                    Open profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button type="button" variant="outline" onClick={loadWorkspace} className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10">
                  Refresh workspace
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">{card.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{card.currency ? formatCurrency(card.value) : card.value.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-3xl" />)}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{error}</div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.label} className="bg-card/85">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{card.currency ? formatCurrency(card.value) : card.value.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Banknote className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {role === "SALES" ? (
              <Card className="mt-6 bg-card/85">
                <CardHeader>
                  <CardTitle>Lead pipeline</CardTitle>
                  <CardDescription>Registered borrowers who have not yet created a loan application.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {leads.length ? leads.map((lead) => (
                    <div key={lead.id} className="rounded-2xl border bg-secondary/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email} · {lead.phone}</p>
                        </div>
                        <Badge className={lead.profileReady ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}>
                          {lead.profileReady ? "Profile ready" : "Needs profiling"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Registered on {displayDateTime(lead.createdAt)}</p>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No idle borrower leads found.</div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {role === "SANCTION" ? (
              <Card className="mt-6 bg-card/85">
                <CardHeader>
                  <CardTitle>Sanction queue</CardTitle>
                  <CardDescription>Review APPLIED loans and decide the next loan status.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {loans.length ? loans.map((loan) => (
                    <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{displayName(loan.borrowerId)}</p>
                          <p className="text-xs text-muted-foreground">{loan.borrowerId?.email ?? "-"} · Applied {displayDateTime(loan.createdAt)}</p>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-700">APPLIED</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                        <span>Amount: {formatCurrency(loan.amount)}</span>
                        <span>Tenure: {loan.tenure} days</span>
                        <span>Repayment: {formatCurrency(loan.totalRepayment)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleSanction(loan._id)} disabled={busyId === loan._id}>{busyId === loan._id ? "Working..." : "Approve"}</Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleReject(loan._id)} disabled={busyId === loan._id}>Reject</Button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No applications waiting for sanction.</div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {role === "DISBURSEMENT" ? (
              <Card className="mt-6 bg-card/85">
                <CardHeader>
                  <CardTitle>Disbursement queue</CardTitle>
                  <CardDescription>Mark sanctioned loans as disbursed after the release reference is captured.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {loans.length ? loans.map((loan) => (
                    <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{displayName(loan.borrowerId)}</p>
                          <p className="text-xs text-muted-foreground">Sanctioned by {displayName(loan.sanctionedBy)} · {loan.borrowerId?.email ?? "-"}</p>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-700">SANCTIONED</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                        <span>Amount: {formatCurrency(loan.amount)}</span>
                        <span>Repayment: {formatCurrency(loan.totalRepayment)}</span>
                        <span>Reference: {loan.transactionReference ?? "Pending"}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleDisburse(loan._id)} disabled={busyId === loan._id}>{busyId === loan._id ? "Working..." : "Mark disbursed"}</Button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No sanctioned loans waiting for release.</div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {role === "COLLECTION" ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card className="bg-card/85">
                  <CardHeader>
                    <CardTitle>Collection queue</CardTitle>
                    <CardDescription>Record repayments for disbursed loans. The backend enforces UTR uniqueness and closes fully repaid loans.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {loans.length ? loans.map((loan) => (
                      <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{displayName(loan.borrowerId)}</p>
                            <p className="text-xs text-muted-foreground">Disbursed by {displayName(loan.disbursedBy)} · Due {displayDate(loan.dueDate)}</p>
                          </div>
                          <Badge className="bg-blue-500/10 text-blue-700">DISBURSED</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                          <span>Outstanding: {formatCurrency(loan.outstandingAmount)}</span>
                          <span>Paid: {formatCurrency(loan.paidAmount)}</span>
                          <span>Repayment: {formatCurrency(loan.totalRepayment)}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => handlePayment(loan._id, loan.outstandingAmount)} disabled={busyId === loan._id}>{busyId === loan._id ? "Working..." : "Record payment"}</Button>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No active disbursed loans are ready for collection.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/85">
                  <CardHeader>
                    <CardTitle>Recent payments</CardTitle>
                    <CardDescription>Latest repayment entries captured by the backend.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {recentPayments.length ? recentPayments.map((payment) => (
                      <div key={payment._id} className="rounded-2xl border bg-secondary/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <Badge className="bg-secondary">{displayDate(payment.paymentDate)}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">UTR {payment.utrNumber}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Loan status {payment.loanId?.status ?? "-"}</p>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No repayments recorded yet.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
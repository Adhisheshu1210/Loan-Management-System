"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Banknote, CheckCircle2, Clock3, ListTodo, PlusCircle, RotateCcw, UserCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExecutiveRole } from "./executive-shell";

type WorkspaceResponse = {
  summary: Record<string, number>;
  leads?: Array<{ id: string; name: string; email: string; phone: string; createdAt: string; profileReady: boolean }>;
  loans?: Array<{
    _id: string;
    amount: number;
    totalRepayment: number;
    paidAmount: number;
    outstandingAmount: number;
    status: string;
    transactionReference?: string | null;
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
    loanId?: { status?: string; amount?: number; outstandingAmount?: number; borrowerId?: { name?: string } | null } | null;
  }>;
};

type Feature = "home" | "leads" | "applications" | "queue" | "payments";

const featureMeta: Record<ExecutiveRole, Record<Feature, { title: string; description: string; empty: string; homeHref: string }>> = {
  SALES: {
    home: { title: "Sales overview", description: "Track new leads and move promising borrowers into application flow.", empty: "No leads are waiting right now.", homeHref: "/sales" },
    leads: { title: "Lead pipeline", description: "Borrowers who registered but have not started an application.", empty: "No idle borrower leads found.", homeHref: "/sales" },
    applications: { title: "Borrower applications", description: "Use this lane when a lead is ready to start the process.", empty: "No applications in progress.", homeHref: "/sales" },
    queue: { title: "Sales queue", description: "Fast access to borrower records and profile readiness.", empty: "No sales queue items.", homeHref: "/sales" },
    payments: { title: "Sales follow-up", description: "Use this page for borrower follow-ups and status checks.", empty: "No follow-up items.", homeHref: "/sales" },
  },
  SANCTION: {
    home: { title: "Sanction overview", description: "Review APPLIED loans and decide approval or rejection.", empty: "No pending applications.", homeHref: "/sanction" },
    leads: { title: "Sanction overview", description: "Same queue, different lens for the sanction team.", empty: "No pending applications.", homeHref: "/sanction" },
    applications: { title: "Sanction queue", description: "Approve or reject applications with notes and reasons.", empty: "No applications waiting for sanction.", homeHref: "/sanction" },
    queue: { title: "Sanction queue", description: "Approve or reject applications with notes and reasons.", empty: "No applications waiting for sanction.", homeHref: "/sanction" },
    payments: { title: "Sanction review history", description: "Recent sanction outcomes and loan decisions.", empty: "No review history.", homeHref: "/sanction" },
  },
  DISBURSEMENT: {
    home: { title: "Disbursement overview", description: "Track sanctioned loans ready to move into disbursed status.", empty: "No sanctioned loans are waiting.", homeHref: "/disbursement" },
    leads: { title: "Disbursement overview", description: "Sanctioned loans that are ready for release.", empty: "No sanctioned loans are waiting.", homeHref: "/disbursement" },
    applications: { title: "Disbursement queue", description: "Mark sanctioned loans as disbursed once reference details are captured.", empty: "No sanctioned loans waiting for release.", homeHref: "/disbursement" },
    queue: { title: "Disbursement queue", description: "Mark sanctioned loans as disbursed once reference details are captured.", empty: "No sanctioned loans waiting for release.", homeHref: "/disbursement" },
    payments: { title: "Disbursement review", description: "Look back at recently disbursed loans and proof links.", empty: "No disbursed loans yet.", homeHref: "/disbursement" },
  },
  COLLECTION: {
    home: { title: "Collection overview", description: "Record repayments and let the backend close loans automatically when paid off.", empty: "No active disbursed loans.", homeHref: "/collection" },
    leads: { title: "Collection overview", description: "Current active loans ready for repayment collection.", empty: "No active disbursed loans.", homeHref: "/collection" },
    applications: { title: "Collection overview", description: "Active disbursed loans and repayment status.", empty: "No active disbursed loans.", homeHref: "/collection" },
    queue: { title: "Collection queue", description: "Record UTR, amount, and payment date against a disbursed loan.", empty: "No active disbursed loans.", homeHref: "/collection" },
    payments: { title: "Payment history", description: "Recent payments and loan balances.", empty: "No repayments recorded yet.", homeHref: "/collection" },
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

export function ExecutiveFeaturePage({ role, feature }: { role: ExecutiveRole; feature: Feature }) {
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const meta = featureMeta[role][feature];

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
    loadWorkspace();
  }, [role]);

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

  const leads = workspace?.leads ?? [];
  const loans = workspace?.loans ?? [];
  const recentPayments = workspace?.recentPayments ?? [];

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

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.9),rgba(16,185,129,0.78))] p-[1px] shadow-soft">
        <div className="grid gap-6 rounded-[29px] bg-slate-950 px-6 py-8 text-white md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/70">{role}</p>
            <h2 className="mt-4 text-3xl font-semibold md:text-5xl">{meta.title}</h2>
            <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">{meta.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-white/90">
                <Link href={meta.homeHref}>
                  Go to home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={loadWorkspace} className="rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10">
                Refresh
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-3xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

          {role === "SALES" && (feature === "leads" || feature === "home") ? (
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>{meta.title}</CardTitle>
                <CardDescription>{meta.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {leads.length ? leads.map((lead) => (
                  <div key={lead.id} className="rounded-2xl border bg-secondary/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email} · {lead.phone}</p>
                      </div>
                      <Badge className={lead.profileReady ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}>{lead.profileReady ? "Profile ready" : "Needs profiling"}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Registered on {displayDateTime(lead.createdAt)}</p>
                  </div>
                )) : <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{meta.empty}</div>}
              </CardContent>
            </Card>
          ) : null}

          {role === "SANCTION" && (feature === "home" || feature === "applications" || feature === "queue") ? (
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Sanction queue</CardTitle>
                <CardDescription>Approve or reject APPLIED loans. Status moves to SANCTIONED or REJECTED.</CardDescription>
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
                      <span>Repayment: {formatCurrency(loan.totalRepayment)}</span>
                      <span>Due: {displayDate(loan.dueDate)}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleSanction(loan._id)} disabled={busyId === loan._id}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleReject(loan._id)} disabled={busyId === loan._id}><XCircle className="h-4 w-4" />Reject</Button>
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{meta.empty}</div>}
              </CardContent>
            </Card>
          ) : null}

          {role === "DISBURSEMENT" && (feature === "home" || feature === "applications" || feature === "queue") ? (
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Disbursement queue</CardTitle>
                <CardDescription>Mark sanctioned loans as disbursed and capture the transaction reference.</CardDescription>
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
                      <Button size="sm" onClick={() => handleDisburse(loan._id)} disabled={busyId === loan._id}><PlusCircle className="h-4 w-4" />Mark disbursed</Button>
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{meta.empty}</div>}
              </CardContent>
            </Card>
          ) : null}

          {role === "COLLECTION" && (feature === "home" || feature === "applications" || feature === "queue") ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="bg-card/85">
                <CardHeader>
                  <CardTitle>Collection queue</CardTitle>
                  <CardDescription>Record payments against disbursed loans. UTR numbers must be unique.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {loans.length ? loans.map((loan) => (
                    <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{displayName(loan.borrowerId)}</p>
                          <p className="text-xs text-muted-foreground">Due {displayDate(loan.dueDate)} · Disbursed by {displayName(loan.disbursedBy)}</p>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-700">DISBURSED</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                        <span>Outstanding: {formatCurrency(loan.outstandingAmount)}</span>
                        <span>Paid: {formatCurrency(loan.paidAmount)}</span>
                        <span>Repayment: {formatCurrency(loan.totalRepayment)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => {
                          handlePayment(loan._id, loan.outstandingAmount);
                        }} disabled={busyId === loan._id}><PlusCircle className="h-4 w-4" />Record payment</Button>
                      </div>
                    </div>
                  )) : <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{meta.empty}</div>}
                </CardContent>
              </Card>

              <Card className="bg-card/85">
                <CardHeader>
                  <CardTitle>Recent payments</CardTitle>
                  <CardDescription>Latest repayments captured by the backend.</CardDescription>
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
                  )) : <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{meta.empty}</div>}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {feature === "payments" && role !== "COLLECTION" ? (
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>{meta.title}</CardTitle>
                <CardDescription>{meta.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">This page is reserved for role-specific audit and follow-up views.</div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
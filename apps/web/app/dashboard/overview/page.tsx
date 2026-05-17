"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeIndianRupee, Banknote, CircleDollarSign, Download, Sparkles, Users } from "lucide-react";
import { api } from "@/services/api";
import { AdminDashboardResponse, AdminLoan, SectionCard, buildCsv, downloadCsv, formatCurrency, loanCode, statusClass, statusLabel } from "@/components/dashboard/admin-dashboard-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fallbackMetrics = {
  totalLoans: 0,
  activeLoans: 0,
  closedLoans: 0,
  usersTotal: 0,
  totalDisbursed: 0,
  totalCollections: 0,
};

export default function DashboardOverviewPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outstandingLoans, setOutstandingLoans] = useState<AdminLoan[]>([]);
  const [outstandingLoading, setOutstandingLoading] = useState(false);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.get("/admin/dashboard")
      .then((response) => {
        if (!active) return;
        setDashboard(response.data.data ?? null);
      })
      .catch((caughtError: any) => {
        if (!active) return;
        setError(caughtError.response?.data?.message ?? "Unable to load dashboard overview");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setOutstandingLoading(true);
    setOutstandingError(null);

    api.get("/dashboard/collection/loans", { params: { page: 1, limit: 6 } })
      .then((response) => {
        if (!active) return;
        setOutstandingLoans(response.data.data ?? []);
      })
      .catch((caughtError: any) => {
        if (!active) return;
        setOutstandingError(caughtError.response?.data?.message ?? "Unable to load outstanding loans");
      })
      .finally(() => {
        if (active) setOutstandingLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = dashboard?.metrics ?? fallbackMetrics;
  const charts = dashboard?.charts ?? { loanVolume: [], collectionsTrend: [], loanLifecycle: [], roleBreakdown: [] };

  const outstandingCsv = useMemo(() => buildCsv([
    ["Loan ID", "Borrower", "Outstanding", "Paid", "Total", "Status"],
    ...outstandingLoans.map((loan) => [loanCode(loan._id), loan.borrower?.name ?? "-", loan.outstandingAmount ?? 0, loan.paidAmount ?? 0, loan.totalRepayment ?? 0, loan.status]),
  ]), [outstandingLoans]);

  const heroStats = useMemo(() => ([
    { label: "Total Loans", value: metrics.totalLoans, icon: BadgeIndianRupee },
    { label: "Active Loans", value: metrics.activeLoans, icon: Banknote },
    { label: "Closed Loans", value: metrics.closedLoans, icon: CircleDollarSign },
    { label: "Users", value: metrics.usersTotal, icon: Users },
  ]), [metrics]);

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Overview
            </div>
            <h2 className="mt-5 text-3xl font-semibold md:text-5xl">Operational control for the full loan lifecycle.</h2>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              Monitor approvals, disbursals, repayments, and user growth from one executive dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-3xl border bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{stat.label}</p>
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{stat.value.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="bg-card/85">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{card.value.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="bg-card/85">
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
                      <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={charts.loanLifecycle} dataKey="value" nameKey="name" outerRadius={100} label>
                        {charts.loanLifecycle.map((entry) => <Cell key={entry.name} fill={entry.color ?? "#2563eb"} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/85">
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
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Recent loans</CardTitle>
                <CardDescription>Latest applications at a glance</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {(dashboard?.recentLoans ?? []).slice(0, 5).map((loan) => (
                  <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</p>
                        <p className="text-xs text-muted-foreground">{loanCode(loan._id)} · {loan.status}</p>
                      </div>
                      <Badge className={statusClass(loan.status)}>{statusLabel(loan.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatCurrency(loan.amount)} · {loan.tenure} days · Due {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : "-"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/85">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Outstanding Tracker</CardTitle>
                    <CardDescription>Active disbursed loans and pending balances</CardDescription>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => downloadCsv("outstanding-tracker.csv", outstandingCsv)}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {outstandingLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
                {outstandingError ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700">{outstandingError}</div> : null}
                {outstandingLoans.map((loan) => (
                  <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{loan.borrower?.name ?? "Unknown borrower"}</p>
                        <p className="text-xs text-muted-foreground">{loanCode(loan._id)} · {loan.borrower?.phone ?? "No phone"}</p>
                      </div>
                      <Badge className={statusClass(loan.status)}>{statusLabel(loan.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Outstanding {formatCurrency(loan.outstandingAmount ?? 0)} · Paid {formatCurrency(loan.paidAmount ?? 0)} · Total {formatCurrency(loan.totalRepayment ?? 0)}</p>
                  </div>
                ))}
                {!outstandingLoans.length && !outstandingLoading ? <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No outstanding loans found.</div> : null}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
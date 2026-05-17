"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/services/api";
import { AdminAnalyticsResponse, SectionCard, formatCurrency, loanCode, statusClass, statusLabel } from "@/components/dashboard/admin-dashboard-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.get("/admin/dashboard/analytics")
      .then((response) => {
        if (!active) return;
        setAnalytics(response.data.data ?? null);
      })
      .catch((caughtError: any) => {
        if (!active) return;
        setError(caughtError.response?.data?.message ?? "Unable to load analytics");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const charts = analytics?.charts ?? { loanVolume: [], collectionsTrend: [], loanLifecycle: [], roleBreakdown: [] };

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Analytics</p>
          <h2 className="mt-2 text-3xl font-semibold">Performance intelligence</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Study loan growth, collection trends, lifecycle distribution, and role mix from a single reporting view.</p>
        </div>
      </SectionCard>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-700">{error}</div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Loan volume</CardTitle>
                <CardDescription>Rolling monthly originations</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.loanVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Collections trend</CardTitle>
                <CardDescription>Repayment movement over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
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

          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Lifecycle mix</CardTitle>
                <CardDescription>Status distribution across the portfolio</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.loanLifecycle} dataKey="value" nameKey="name" outerRadius={110} label>
                      {charts.loanLifecycle.map((entry) => <Cell key={entry.name} fill={entry.color ?? "#2563eb"} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Recent payment activity</CardTitle>
                <CardDescription>Latest eight settlement events</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {(analytics?.recentPayments ?? []).map((payment) => (
                  <div key={payment._id} className="rounded-2xl border bg-secondary/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{payment.borrower?.name ?? "Unknown borrower"}</p>
                        <p className="text-xs text-muted-foreground">{payment.utrNumber} · {new Date(payment.paymentDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className={statusClass(payment.loan?.status ?? "")}>{statusLabel(payment.loan?.status ?? "")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{loanCode(payment.loan?._id ?? payment._id)} · {formatCurrency(payment.amount)} · {payment.collector?.name ?? "Unassigned"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
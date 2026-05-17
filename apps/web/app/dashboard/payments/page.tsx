"use client";

import { useEffect, useState } from "react";
import { Search, UploadCloud } from "lucide-react";
import { api } from "@/services/api";
import { AdminPayment, downloadCsv, formatCurrency, loanStatusOptions, SectionCard, statusClass } from "@/components/dashboard/admin-dashboard-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loanStatus, setLoanStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const timeout = window.setTimeout(() => {
      api.get("/admin/dashboard/payments", {
        params: {
          page,
          limit,
          search: query.trim() || undefined,
          loanStatus,
        },
      })
        .then((response) => {
          if (!active) return;
          setPayments(response.data.data ?? []);
          setTotal(Number(response.data.meta?.total ?? 0));
        })
        .catch((caughtError: any) => {
          if (!active) return;
          setError(caughtError.response?.data?.message ?? "Unable to load payments");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [page, limit, query, loanStatus]);

  const exportCsv = async () => {
    const response = await api.get("/admin/dashboard/payments/export", {
      params: {
        search: query.trim() || undefined,
        loanStatus,
      },
      responseType: "blob",
    });
    downloadCsv("admin-payments.csv", response.data);
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Payments</p>
            <h2 className="mt-2 text-3xl font-semibold">Repayment ledger</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Track collections and export the payment slice you need.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportCsv}><UploadCloud className="h-4 w-4" />Export CSV</Button>
          </div>
        </div>
      </SectionCard>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>Payment management</CardTitle>
          <CardDescription>Search repayments and review collector details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search UTR, borrower, or loan status" className="pl-10" />
            </div>
            <Select value={loanStatus} onChange={(event) => { setPage(1); setLoanStatus(event.target.value); }}>
              {loanStatusOptions.map((item) => <option key={item} value={item}>{item === "ALL" ? "All loan statuses" : item}</option>)}
            </Select>
          </div>

          <div className="overflow-hidden rounded-2xl border">
            {loading ? (
              <div className="grid gap-3 p-6">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            ) : error ? (
              <div className="grid gap-3 p-10 text-center text-sm text-rose-700">{error}</div>
            ) : payments.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Loan</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <div className="grid">
                          <span className="font-medium">{payment.utrNumber}</span>
                          <span className="text-xs text-muted-foreground">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass(payment.loan?.status ?? "")}>{payment.loan?.status ?? "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="grid">
                          <span className="font-medium">{payment.borrower?.name ?? "-"}</span>
                          <span className="text-xs text-muted-foreground">{payment.borrower?.phone ?? payment.borrower?.email ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid">
                          <span className="font-medium">{payment.collector?.name ?? "-"}</span>
                          <span className="text-xs text-muted-foreground">{payment.collector?.email ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid gap-3 p-10 text-center">
                <p className="font-medium">No payments match the current filters.</p>
                <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different loan status.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {total ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => (current * limit < total ? current + 1 : current))} disabled={page * limit >= total}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
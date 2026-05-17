"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExecutiveShell } from "@/components/executive/executive-shell";
import { LoanTimeline, type LoanTimelineEvent } from "@/components/executive/loan-timeline";
import { ModuleHero } from "@/components/executive/module-hero";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadBlobAsFile } from "@/lib/utils";

type CollectionLoan = {
  _id: string;
  status: string;
  outstandingAmount: number;
  totalRepayment: number;
  paidAmount: number;
  borrowerId?: { name?: string; email?: string; phone?: string } | null;
};

type PaymentItem = {
  _id: string;
  amount: number;
  utrNumber: string;
  paymentDate: string;
  borrower?: { name?: string; email?: string } | null;
  loan?: { _id?: string; status?: string; outstandingAmount?: number } | null;
};

export default function CollectionPaymentsPage() {
  const [loans, setLoans] = useState<CollectionLoan[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [loanTotal, setLoanTotal] = useState(0);
  const [timeline, setTimeline] = useState<Record<string, LoanTimelineEvent[]>>({});
  const [timelineBusyId, setTimelineBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [loanRes, paymentRes] = await Promise.all([
        api.get("/dashboard/collection/loans", { params: { search: search.trim() || undefined, page, limit } }),
        api.get("/dashboard/collection/payments", { params: { search: search.trim() || undefined, page, limit } }),
      ]);
      const loanItems = loanRes.data.data ?? [];
      setLoans(loanItems);
      setPayments(paymentRes.data.data ?? []);
      setLoanTotal(loanRes.data.meta?.total ?? 0);
      setPaymentTotal(paymentRes.data.meta?.total ?? 0);
      if (!loanId && loanItems[0]?._id) {
        setLoanId(loanItems[0]._id);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    const response = await api.get("/dashboard/collection/payments/export", {
      params: { search: search.trim() || undefined, loanId: loanId || undefined },
      responseType: "blob",
    });
    downloadBlobAsFile(response.data, "collection-payments.csv");
  };

  const toggleTimeline = async (targetLoanId: string) => {
    if (timeline[targetLoanId]) {
      setTimeline((prev) => {
        const next = { ...prev };
        delete next[targetLoanId];
        return next;
      });
      return;
    }

    try {
      setTimelineBusyId(targetLoanId);
      const response = await api.get(`/dashboard/loans/${targetLoanId}/timeline`);
      setTimeline((prev) => ({ ...prev, [targetLoanId]: response.data.data?.events ?? [] }));
    } catch {
      toast.error("Unable to fetch timeline");
    } finally {
      setTimelineBusyId(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [search, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(paymentTotal / limit));

  const submitPayment = async () => {
    const numericAmount = Number(amount);
    if (!loanId) {
      toast.error("Select a loan");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    try {
      setSaving(true);
      await api.post("/dashboard/collection/payments", {
        loanId,
        amount: numericAmount,
        utrNumber: utrNumber.trim(),
        paymentDate,
      });
      toast.success("Payment added");
      setAmount("");
      setUtrNumber("");
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to add payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExecutiveShell role="COLLECTION" section="features">
      <div className="space-y-6">
        <ModuleHero
          eyebrow="Collection Workflow"
          title="Repayment engine with audit confidence"
          description="Capture collections with strict controls, export daily postings, and inspect every disbursed loan journey."
          imageSrc="/illustrations/collection-module.svg"
          imageAlt="Collection module"
          imageFit="contain"
          className="overflow-hidden border-0 bg-gradient-to-r from-slate-900/20 via-cyan-700/10 to-cyan-500/20"
        />

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
            <CardDescription>Search repayments and review collector details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search borrower or UTR" />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))}>
              {[10, 20, 50].map((item) => <option key={item} value={item}>{item}/page</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-card/85">
            <CardHeader>
              <CardTitle>Add Payment</CardTitle>
              <CardDescription>Rules: unique UTR, amount not above pending, auto-close when fully paid.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Select value={loanId} onChange={(event) => setLoanId(event.target.value)}>
                <option value="">Select disbursed loan</option>
                {loans.map((loan) => (
                  <option key={loan._id} value={loan._id}>
                    {(loan.borrowerId?.name ?? "Borrower")} - Pending ₹{loan.outstandingAmount.toLocaleString()}
                  </option>
                ))}
              </Select>
              {loanId ? (() => {
                const selected = loans.find((l) => l._id === loanId);
                if (!selected) return null;
                return (
                  <div className="rounded-2xl border bg-background/5 p-3 text-sm">
                    <p className="font-medium">Preview: {selected.borrowerId?.name ?? 'Borrower'}</p>
                    <p className="text-muted-foreground">Outstanding: ₹{selected.outstandingAmount.toLocaleString()}</p>
                    <p className="text-muted-foreground">Paid: ₹{selected.paidAmount?.toLocaleString() ?? 0}</p>
                    <p className="text-muted-foreground">Repayment: ₹{selected.totalRepayment.toLocaleString()}</p>
                  </div>
                );
              })() : null}
              <div className="grid gap-3 md:grid-cols-3">
                <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
                <Input value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} placeholder="UTR Number" />
                <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
              </div>
              <Button type="button" onClick={submitPayment} disabled={saving}>{saving ? "Saving..." : "Add Payment"}</Button>
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardHeader>
              <CardTitle>Outstanding Tracker</CardTitle>
              <CardDescription>Active disbursed loans and pending balances.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
              {loans.map((loan) => (
                <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{loan.borrowerId?.name ?? "Borrower"}</p>
                    <Badge className="bg-blue-500/10 text-blue-700">{loan.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Outstanding ₹{loan.outstandingAmount.toLocaleString()} / Total ₹{loan.totalRepayment.toLocaleString()}</p>
                  <div className="mt-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => toggleTimeline(loan._id)} disabled={timelineBusyId === loan._id}>{timeline[loan._id] ? "Hide timeline" : "View timeline"}</Button>
                  </div>
                  {timeline[loan._id] ? <LoanTimeline events={timeline[loan._id]} /> : null}
                </div>
              ))}
              {!loans.length && !loading ? <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No disbursed loans in collection queue.</div> : null}
              <p className="text-xs text-muted-foreground">Loan queue count: {loanTotal}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recent repayments with borrower and status details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {payments.map((payment) => (
              <div key={payment._id} className="rounded-2xl border bg-secondary/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">₹{payment.amount.toLocaleString()} · UTR {payment.utrNumber}</p>
                    <p className="text-xs text-muted-foreground">{payment.borrower?.name ?? "Borrower"} · {payment.borrower?.email ?? "-"}</p>
                  </div>
                  <Badge className="bg-secondary">{new Date(payment.paymentDate).toLocaleDateString()}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Loan status: {payment.loan?.status ?? "-"}</p>
              </div>
            ))}
            {!payments.length ? <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No payments recorded yet.</div> : null}

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages} ({paymentTotal} payments)</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ExecutiveShell>
  );
}
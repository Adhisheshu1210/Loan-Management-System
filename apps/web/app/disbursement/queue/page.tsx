"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExecutiveShell } from "@/components/executive/executive-shell";
import { LoanTimeline, type LoanTimelineEvent } from "@/components/executive/loan-timeline";
import { ModuleHero } from "@/components/executive/module-hero";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { downloadBlobAsFile } from "@/lib/utils";

type DisbursementLoan = {
  _id: string;
  amount: number;
  totalRepayment: number;
  status: string;
  borrowerId?: { name?: string; email?: string; phone?: string } | null;
  disbursementProofUrl?: string | null;
};

export default function DisbursementQueuePage() {
  const [items, setItems] = useState<DisbursementLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [timeline, setTimeline] = useState<Record<string, LoanTimelineEvent[]>>({});
  const [timelineBusyId, setTimelineBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/disbursement/loans", { params: { search: search.trim() || undefined, page, limit } });
      setItems(response.data.data ?? []);
      setTotal(response.data.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    const response = await api.get("/dashboard/disbursement/loans/export", {
      params: { search: search.trim() || undefined },
      responseType: "blob",
    });
    downloadBlobAsFile(response.data, "disbursement-loans.csv");
  };

  const toggleTimeline = async (loanId: string) => {
    if (timeline[loanId]) {
      setTimeline((prev) => {
        const next = { ...prev };
        delete next[loanId];
        return next;
      });
      return;
    }
    try {
      setTimelineBusyId(loanId);
      const response = await api.get(`/dashboard/loans/${loanId}/timeline`);
      setTimeline((prev) => ({ ...prev, [loanId]: response.data.data?.events ?? [] }));
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const markDisbursed = async (loanId: string) => {
    const transactionReference = refs[loanId]?.trim();
    if (!transactionReference) {
      toast.error("Transaction reference is required");
      return;
    }
    try {
      setBusyId(loanId);
      await api.patch(`/dashboard/disbursement/loans/${loanId}/mark`, {
        transactionReference,
        disbursementDate: dates[loanId] || undefined,
      });

      const file = proofFiles[loanId];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/dashboard/disbursement/loans/${loanId}/proof`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Loan marked as disbursed");
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to mark disbursed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ExecutiveShell role="DISBURSEMENT" section="features">
      <div className="space-y-6">
        <ModuleHero
          eyebrow="Disbursement Workflow"
          title="Sanction-to-cash execution board"
          description="Capture references, upload proof artifacts, and verify full loan trail before releasing funds."
          imageSrc="/illustrations/disbursement-module.svg"
          imageAlt="Disbursement module"
          imageFit="contain"
          className="overflow-hidden border-0 bg-gradient-to-r from-blue-600/20 via-indigo-500/10 to-violet-500/20"
        />

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Disbursement Module</CardTitle>
            <CardDescription>Handle sanctioned loans and move them to disbursed with reference/date/proof.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sanctioned loans" />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))}>
              {[10, 20, 50].map((item) => <option key={item} value={item}>{item}/page</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Sanctioned Loans</CardTitle>
            <CardDescription>Transition rule: SANCTIONED to DISBURSED.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && !items.length ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No sanctioned loans available.</div> : null}
            {items.map((loan) => (
              <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{loan.borrowerId?.name ?? "Borrower"}</p>
                    <p className="text-xs text-muted-foreground">{loan.borrowerId?.email ?? "-"} · {loan.borrowerId?.phone ?? "-"}</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-700">{loan.status}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <span>Amount: ₹{loan.amount.toLocaleString()}</span>
                  <span>Total repayment: ₹{loan.totalRepayment.toLocaleString()}</span>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <Input value={refs[loan._id] ?? ""} onChange={(event) => setRefs((prev) => ({ ...prev, [loan._id]: event.target.value }))} placeholder="Transaction reference" />
                  <Input type="date" value={dates[loan._id] ?? ""} onChange={(event) => setDates((prev) => ({ ...prev, [loan._id]: event.target.value }))} />
                  <Input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setProofFiles((prev) => ({ ...prev, [loan._id]: event.target.files?.[0] ?? null }))} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => markDisbursed(loan._id)} disabled={busyId === loan._id}>Mark as Disbursed</Button>
                  <Button type="button" variant="secondary" onClick={() => toggleTimeline(loan._id)} disabled={timelineBusyId === loan._id}>{timeline[loan._id] ? "Hide timeline" : "View timeline"}</Button>
                  {loan.disbursementProofUrl ? <a href={loan.disbursementProofUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Current proof</a> : null}
                </div>

                {timeline[loan._id] ? <LoanTimeline events={timeline[loan._id]} /> : null}
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages} ({total} total sanctioned loans)</span>
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
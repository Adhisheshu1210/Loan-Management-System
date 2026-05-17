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

type SanctionLoan = {
  _id: string;
  amount: number;
  totalRepayment: number;
  status: string;
  createdAt: string;
  borrowerId?: { name?: string; email?: string; phone?: string } | null;
  salarySlips?: Array<{ _id: string; fileUrl: string; fileType: string; uploadedAt: string }>;
};

export default function SanctionApplicationsPage() {
  const [items, setItems] = useState<SanctionLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [timeline, setTimeline] = useState<Record<string, LoanTimelineEvent[]>>({});
  const [timelineBusyId, setTimelineBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/sanction/loans", { params: { search: search.trim() || undefined, status: "APPLIED", page, limit } });
      setItems(response.data.data ?? []);
      setTotal(response.data.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    const response = await api.get("/dashboard/sanction/loans/export", {
      params: { search: search.trim() || undefined, status: "APPLIED" },
      responseType: "blob",
    });
    downloadBlobAsFile(response.data, "sanction-loans.csv");
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

  const decide = async (loanId: string, decision: "APPROVE" | "REJECT") => {
    try {
      setBusyId(loanId);
      await api.patch(`/dashboard/sanction/loans/${loanId}/decision`, {
        decision,
        notes: notes[loanId] || undefined,
        reason: reasons[loanId] || undefined,
      });
      toast.success(decision === "APPROVE" ? "Loan sanctioned" : "Loan rejected");
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to update loan");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ExecutiveShell role="SANCTION" section="features">
      <div className="space-y-6">
        <ModuleHero
          eyebrow="Sanction Workflow"
          title="Decision desk with document intelligence"
          description="Review full borrower packets, take compliant decisions, and inspect lifecycle timeline before every sanction action."
          imageSrc="/illustrations/sanction-module.svg"
          imageAlt="Sanction module"
          imageFit="contain"
          className="overflow-hidden border-0 bg-gradient-to-r from-teal-600/20 via-cyan-500/10 to-sky-500/20"
        />

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Sanction Module</CardTitle>
            <CardDescription>Review applied loans, inspect documents, and approve or reject with mandatory reason.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search borrower" />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))}>
              {[10, 20, 50].map((item) => <option key={item} value={item}>{item}/page</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Applied Loans</CardTitle>
            <CardDescription>Transition rules: APPLIED to SANCTIONED or APPLIED to REJECTED.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && !items.length ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No applications pending.</div> : null}
            {items.map((loan) => (
              <div key={loan._id} className="rounded-2xl border bg-secondary/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{loan.borrowerId?.name ?? "Borrower"}</p>
                    <p className="text-xs text-muted-foreground">{loan.borrowerId?.email ?? "-"} · {loan.borrowerId?.phone ?? "-"}</p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-700">{loan.status}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <span>Amount: ₹{loan.amount.toLocaleString()}</span>
                  <span>Repayment: ₹{loan.totalRepayment.toLocaleString()}</span>
                  <span>Applied: {new Date(loan.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="mt-3 rounded-xl border bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Salary Slips / Docs</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(loan.salarySlips ?? []).slice(0, 4).map((doc) => (
                      <a key={doc._id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1 text-xs hover:bg-secondary/60">Open document</a>
                    ))}
                    {!loan.salarySlips?.length ? <span className="text-xs text-muted-foreground">No uploaded slips</span> : null}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <Input value={notes[loan._id] ?? ""} onChange={(event) => setNotes((prev) => ({ ...prev, [loan._id]: event.target.value }))} placeholder="Sanction notes (optional)" />
                  <Input value={reasons[loan._id] ?? ""} onChange={(event) => setReasons((prev) => ({ ...prev, [loan._id]: event.target.value }))} placeholder="Rejection reason (required for reject)" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => decide(loan._id, "APPROVE")} disabled={busyId === loan._id}>Approve</Button>
                  <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={() => decide(loan._id, "REJECT")} disabled={busyId === loan._id}>Reject</Button>
                  <Button type="button" variant="secondary" onClick={() => toggleTimeline(loan._id)} disabled={timelineBusyId === loan._id}>{timeline[loan._id] ? "Hide timeline" : "View timeline"}</Button>
                </div>

                {timeline[loan._id] ? <LoanTimeline events={timeline[loan._id]} /> : null}
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages} ({total} total applications)</span>
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
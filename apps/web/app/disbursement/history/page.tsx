"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ModuleHero } from "@/components/executive/module-hero";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { downloadBlobAsFile } from "@/lib/utils";

type DisbursementItem = {
  _id: string;
  loanId: string;
  amount: number;
  transactionReference?: string;
  disbursementDate?: string;
  byName?: string;
  byEmail?: string;
};

export default function DisbursementHistoryPage() {
  const [items, setItems] = useState<DisbursementItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/disbursement/history", { params: { search: search.trim() || undefined, page, limit } });
      setItems(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Unable to load disbursement history");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    const res = await api.get("/dashboard/disbursement/history/export", { params: { search: search.trim() || undefined }, responseType: "blob" });
    downloadBlobAsFile(res.data, "disbursement-history.csv");
  };

  useEffect(() => {
    const t = window.setTimeout(load, 150);
    return () => window.clearTimeout(t);
  }, [search, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <ExecutiveShell role="DISBURSEMENT" section="features">
      <div className="space-y-6">
        <ModuleHero
          eyebrow="Disbursement History"
          title="Audit of funds released"
          description="Review disbursement events, who executed them, and the transaction references."
          imageSrc="/illustrations/disbursement-module.svg"
          imageAlt="Disbursement history"
          imageFit="contain"
          className="overflow-hidden border-0 bg-gradient-to-r from-blue-600/5 via-indigo-500/5 to-violet-500/5"
        />

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Disbursement History</CardTitle>
            <CardDescription>Filter by borrower, reference or date range. Export CSV for reconciliation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search borrower, reference or loan id" />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))}>
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Records</CardTitle>
            <CardDescription>Recent disbursement events</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && !items.length ? <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No disbursement records found.</div> : null}
            {items.map((it) => (
              <div key={it._id} className="rounded-2xl border bg-secondary/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Loan {it.loanId}</p>
                    <p className="text-xs text-muted-foreground">Ref: {it.transactionReference ?? "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{it.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{it.disbursementDate ? new Date(it.disbursementDate).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">By: {it.byName ?? "-"} {it.byEmail ? `· ${it.byEmail}` : ""}</p>
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages} ({total} records)</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Previous</Button>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ExecutiveShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ModuleHero } from "@/components/executive/module-hero";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadBlobAsFile } from "@/lib/utils";

type SalesBorrower = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileReady: boolean;
  breEligible: boolean | null;
  latestApplicationStatus: string;
  lastActivityAt: string;
  createdAt: string;
};

export default function SalesLeadsPage() {
  const [items, setItems] = useState<SalesBorrower[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedBorrower, setSelectedBorrower] = useState<SalesBorrower | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const statusLabel = (s: string | null | undefined) => {
    switch (s) {
      case "NOT_APPLIED":
        return "Not applied";
      case "NEW":
        return "New";
      case "INCOMPLETE":
        return "Incomplete";
      case "APPLIED":
        return "Applied";
      case "SANCTIONED":
        return "Sanctioned";
      case "DISBURSED":
        return "Disbursed";
      case "CLOSED":
        return "Closed";
      case "REJECTED":
        return "Rejected";
      default:
        return s ?? "Unknown";
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/sales/borrowers", {
        params: { search: search.trim() || undefined, status, page, limit },
      });
      setItems(response.data.data ?? []);
      setTotal(response.data.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    const response = await api.get("/dashboard/sales/borrowers/export", {
      params: { search: search.trim() || undefined, status },
      responseType: "blob",
    });
    downloadBlobAsFile(response.data, "sales-borrowers.csv");
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [search, status, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <ExecutiveShell role="SALES" section="features">
      <div className="space-y-6">
        <ModuleHero
          eyebrow="Sales Workflow"
          title="Lead funnel with complete borrower progression"
          description="Track first contact to submission readiness and export filtered lead books for daily follow-up runs."
          imageSrc="/illustrations/sales-module.svg"
          imageFit="contain"
          imageAlt="Sales module"
          className="overflow-hidden border-0 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-red-500/20"
        />

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Sales Module</CardTitle>
            <CardDescription>View borrowers, track incomplete applications, and follow up leads.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_120px_auto_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone" />
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              {[
                "ALL",
                "NEW",
                "INCOMPLETE",
                "APPLIED",
                "SANCTIONED",
                "DISBURSED",
                "CLOSED",
                "REJECTED",
              ].map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))}>
              {[10, 20, 50].map((item) => <option key={item} value={item}>{item}/page</option>)}
            </Select>
            <Button type="button" variant="secondary" onClick={downloadCsv}>Export CSV</Button>
            <Button type="button" variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>

        {selectedBorrower ? (
          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle>Borrower Details</CardTitle>
              <CardDescription>Selected borrower details and application progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold">{selectedBorrower.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBorrower.email} · {selectedBorrower.phone}</p>
                  <p className="mt-2 text-sm">Status: <strong>{statusLabel(selectedBorrower.latestApplicationStatus)}</strong></p>
                  <p className="mt-1 text-sm">Profile: {selectedBorrower.profileReady ? "Ready" : "Pending"}</p>
                  <p className="mt-1 text-sm">BRE Eligible: {selectedBorrower.breEligible ? "Yes" : "No"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Created: {new Date(selectedBorrower.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Button variant="outline" onClick={() => setSelectedBorrower(null)}>Close</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/85"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Leads</p><p className="mt-2 text-3xl font-semibold">{items.length}</p></CardContent></Card>
          <Card className="bg-card/85"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Incomplete</p><p className="mt-2 text-3xl font-semibold">{items.filter((item) => item.latestApplicationStatus === "INCOMPLETE").length}</p></CardContent></Card>
          <Card className="bg-card/85"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Applied</p><p className="mt-2 text-3xl font-semibold">{items.filter((item) => item.latestApplicationStatus === "APPLIED").length}</p></CardContent></Card>
        </div>

        <Card className="bg-card/85">
          <CardHeader>
            <CardTitle>Borrower List</CardTitle>
            <CardDescription>Contact details and progress status for every lead.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && !items.length ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">No borrowers found for current filters.</div> : null}
            {items.map((borrower) => (
              <div
                key={borrower.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedBorrower(borrower)}
                className={`rounded-2xl border p-4 ${selectedBorrower?.id === borrower.id ? "ring-2 ring-primary" : "bg-secondary/20"} cursor-pointer`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{borrower.name}</p>
                    <p className="text-xs text-muted-foreground">{borrower.email} · {borrower.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500/10 text-blue-700">{statusLabel(borrower.latestApplicationStatus)}</Badge>
                    <Badge className={borrower.profileReady ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}>{borrower.profileReady ? "Profile ready" : "Profile pending"}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Last activity: {new Date(borrower.lastActivityAt).toLocaleString()}</p>
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/70 p-3 text-sm">
              <span className="text-muted-foreground">Page {page} of {totalPages} ({total} total leads)</span>
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
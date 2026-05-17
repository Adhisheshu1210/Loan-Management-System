"use client";

import { useEffect, useState } from "react";
import { Search, UploadCloud } from "lucide-react";
import { api } from "@/services/api";
import { AdminUser, downloadCsv, roleOptions, SectionCard } from "@/components/dashboard/admin-dashboard-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/users", {
        params: {
          page,
          limit,
          search: query.trim() || undefined,
          role,
        },
      });
      setUsers(response.data.data ?? []);
      setTotal(Number(response.data.meta?.total ?? 0));
    } catch (caughtError: any) {
      setError(caughtError.response?.data?.message ?? "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadUsers();
    }, 200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [page, limit, query, role]);

  const exportCsv = async () => {
    const response = await api.get("/admin/dashboard/users/export", {
      params: {
        search: query.trim() || undefined,
        role,
      },
      responseType: "blob",
    });
    downloadCsv("admin-users.csv", response.data);
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Users</p>
            <h2 className="mt-2 text-3xl font-semibold">Account governance</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Search accounts, review contact verification, and adjust roles from a single controlled surface.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportCsv}><UploadCloud className="h-4 w-4" />Export CSV</Button>
          </div>
        </div>
      </SectionCard>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>User management</CardTitle>
          <CardDescription>Search users and adjust their platform role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search users by name, email, or phone" className="pl-10" />
            </div>
            <Select value={role} onChange={(event) => { setPage(1); setRole(event.target.value); }}>
              {roleOptions.map((item) => <option key={item} value={item}>{item === "ALL" ? "All roles" : item}</option>)}
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
            ) : users.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="grid">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid text-sm">
                          <span>{user.phone}</span>
                          <span className="text-xs text-muted-foreground">{user.secondaryEmail ?? "No secondary email"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={user.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-700"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                          <Badge className={user.phoneVerifiedAt ? "bg-blue-500/10 text-blue-700" : "bg-amber-500/10 text-amber-700"}>{user.phoneVerifiedAt ? "Phone verified" : "Phone pending"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/10 text-blue-700">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid gap-3 p-10 text-center">
                <p className="font-medium">No users match the current filters.</p>
                <p className="text-sm text-muted-foreground">Try clearing the search or selecting a different role.</p>
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
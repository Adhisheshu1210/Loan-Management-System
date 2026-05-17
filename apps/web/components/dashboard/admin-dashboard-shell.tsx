"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { adminNavItems } from "@/components/dashboard/admin-dashboard-utils";
import { Button } from "@/components/ui/button";

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    api.get("/auth/me")
      .then((response) => {
        const user = response.data.data?.user;
        if (user) {
          auth.setAuth(user, null);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [auth, router]);

  const user = auth.user;

  const activeLabel = useMemo(() => {
    const current = adminNavItems.find((item) => pathname.startsWith(item.href));
    return current?.label ?? "Overview";
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore server errors and proceed with local logout
    } finally {
      auth.logout();
      // use full navigation to ensure cookies cleared and middleware runs
      if (typeof window !== "undefined") window.location.href = "/login";
      else router.replace("/login");
    }
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.96))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Admin workspace</p>
            <h1 className="mt-1 text-lg font-semibold md:text-2xl">{activeLabel}</h1>
          </div>

          <nav className="hidden flex-wrap items-center gap-2 md:flex">
            {adminNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Button key={item.href} asChild variant={active ? "default" : "outline"} size="sm" className={active ? "shadow-soft" : "bg-background/70"}>
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border bg-background/75 px-3 py-2 text-sm md:flex">
              <UserCircle2 className="h-4 w-4" />
              <span className="font-medium">{user?.name ?? "Admin"}</span>
            </div>
            <Button asChild variant="outline" className="bg-background/80">
              <Link href="/dashboard/profile">Profile</Link>
            </Button>
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4 md:px-6 md:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {adminNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Button key={item.href} asChild variant={active ? "default" : "outline"} size="sm" className="whitespace-nowrap">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
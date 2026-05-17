"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export type ExecutiveRole = "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION";
export type ExecutiveSection = "home" | "features" | "profile";

const roleMeta: Record<ExecutiveRole, { title: string; eyebrow: string }> = {
  SALES: { title: "Sales workspace", eyebrow: "Lead tracking" },
  SANCTION: { title: "Sanction workspace", eyebrow: "Approval review" },
  DISBURSEMENT: { title: "Disbursement workspace", eyebrow: "Funds release" },
  COLLECTION: { title: "Collection workspace", eyebrow: "Repayment control" },
};

const roleQuickLinks: Record<ExecutiveRole, Array<{ label: string; href: string }>> = {
  SALES: [
    { label: "Leads", href: "/sales/leads" },
    { label: "Applications", href: "/sales/applications" },
  ],
  SANCTION: [
    { label: "Applications", href: "/sanction/applications" },
  ],
  DISBURSEMENT: [
    { label: "Queue", href: "/disbursement/queue" },
  ],
  COLLECTION: [
    { label: "Payments", href: "/collection/payments" },
  ],
};

export function getRoleFromPath(pathname: string): ExecutiveRole {
  if (pathname.startsWith("/sanction")) return "SANCTION";
  if (pathname.startsWith("/disbursement")) return "DISBURSEMENT";
  if (pathname.startsWith("/collection")) return "COLLECTION";
  return "SALES";
}

export function ExecutiveShell({ children, role: explicitRole, section = "home" }: { children: React.ReactNode; role?: ExecutiveRole; section?: ExecutiveSection }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const role = useMemo(() => explicitRole ?? getRoleFromPath(pathname), [explicitRole, pathname]);
  const meta = roleMeta[role];

  useEffect(() => {
    setMounted(true);
    api.get("/auth/me")
      .then((response) => {
        const user = response.data.data?.user;
        if (user) auth.setAuth(user, null);
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [auth, router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout failures
    } finally {
      auth.logout();
      router.replace("/login");
    }
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.96))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">{meta.eyebrow}</p>
            <h1 className="mt-1 text-lg font-semibold md:text-2xl">{meta.title}</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border bg-background/75 px-3 py-2 text-sm md:flex">
            <UserCircle2 className="h-4 w-4" />
            <span className="font-medium">{auth.user?.name ?? role}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="bg-background/80">
              <Link href={`/${role.toLowerCase()}`}>Home</Link>
            </Button>
            {roleQuickLinks[role].map((item) => (
              <Button key={item.href} asChild variant="outline" className="hidden bg-background/80 md:inline-flex">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <Button asChild variant="outline" className="bg-background/80">
              <Link href={`/${role.toLowerCase()}/profile`}>Profile</Link>
            </Button>
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4 md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
            {section === "profile" ? "Profile" : section === "features" ? "Feature pages" : "Home"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
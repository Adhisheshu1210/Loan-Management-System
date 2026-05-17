import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AuthShell({ title, description, eyebrow, children }: { title: string; description: string; eyebrow: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.15),_transparent_24%)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-fintech-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-slate-950/20" />
        <div className="relative">
          <Badge className="border-white/30 bg-white/10 text-white">{eyebrow}</Badge>
          <h1 className="mt-8 max-w-xl text-5xl font-semibold tracking-tight">Loan operations designed for speed, clarity, and control.</h1>
          <p className="mt-6 max-w-lg text-white/80">Secure onboarding, OTP-verified access, role-based execution, and dashboards that stay fast on every screen.</p>
        </div>
        <div className="relative grid gap-4 sm:grid-cols-2">
          {[
            { icon: ShieldCheck, label: "JWT", value: "Secure sessions" },
            { icon: LockKeyhole, label: "OTP", value: "Email verification" },
            { icon: CheckCircle2, label: "BRE", value: "Backend enforced rules" },
            { icon: Sparkles, label: "Uploads", value: "Cloudinary/local fallback" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-white/70">{label}</p>
                  <p className="mt-1 font-medium">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10 md:px-8">
        <div className="w-full max-w-xl">
          <Link href="/" className="mb-6 inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-semibold tracking-tight text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fintech-gradient text-white shadow-soft">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span>Loan Management System</span>
          </Link>
          <Card className="border-white/40 bg-white/85 shadow-soft backdrop-blur dark:bg-slate-950/85">
            <CardHeader className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-secondary/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Secure access
            </div>
            <CardTitle className="text-3xl">{title}</CardTitle>
            <CardDescription className="leading-6">{description}</CardDescription>
            </CardHeader>
          <Separator />
          <CardContent className="pt-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Clock3,
  FileText,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ContactQueryForm } from "@/components/landing/contact-query-form";
import { FeaturesSection } from "@/components/landing/features";
import { WorkflowSection } from "@/components/landing/workflow";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { FaqSection } from "@/components/landing/faq";

type LandingData = {
  title?: string;
  actions?: { loginLabel?: string } | null;
} | null;

const operationalSteps = [
  {
    title: "Lead capture",
    description: "Sales teams capture borrower interest, route it into the pipeline, and keep every touchpoint visible.",
    icon: Users,
  },
  {
    title: "Verification",
    description: "Sanction teams review documents, OTP verification, and borrower eligibility in one workspace.",
    icon: Fingerprint,
  },
  {
    title: "Approval & disbursement",
    description: "Loan decisions, approvals, and disbursement events are tracked with audit-friendly timelines.",
    icon: BadgeCheck,
  },
  {
    title: "Collections and closure",
    description: "Collections, repayment history, and status updates stay aligned from the first EMI to closure.",
    icon: Wallet,
  },
];

const valueCards = [
  {
    title: "Secure by default",
    description: "JWT auth, refresh tokens, layered roles, and verified contact flows keep access controlled.",
    icon: ShieldCheck,
  },
  {
    title: "Operational clarity",
    description: "Executive dashboards, route-based workspaces, and CSV exports reduce manual coordination.",
    icon: BarChart3,
  },
  {
    title: "Faster turnaround",
    description: "From onboarding to sanctioning, the interface is tuned for fewer clicks and faster decisions.",
    icon: Clock3,
  },
  {
    title: "Built for scale",
    description: "Clean separation between web, API, and shared logic makes the platform easy to evolve.",
    icon: Building2,
  },
];

const metrics = [
  { label: "Role-based workspaces", value: "6" },
  { label: "Loan lifecycle stages", value: "4" },
  { label: "Verified communication channels", value: "3" },
  { label: "Audit-ready exports", value: "CSV" },
];

export function LandingPage({ landing }: { landing?: LandingData }) {
  const loginLabel = landing?.actions?.loginLabel ?? "Executive Login";
  const title = landing?.title ?? "Loan Management System";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_22%),linear-gradient(to_bottom,_hsl(var(--background)),_hsl(var(--background)))]">
      <SiteHeader />
      <main className="relative overflow-hidden">
        <section className="px-4 pt-14 md:px-6 md:pt-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="border-primary/15 bg-primary/10 px-4 py-1.5 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Professional loan operations for modern teams
              </Badge>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                {title} that feels premium, fast, and operationally complete.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                A polished fintech platform for borrower onboarding, sanction workflows, disbursement control, and collection tracking - designed to make every step visible and easy to manage.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link href="/borrower/apply">
                    Apply for Loan
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl">
                  <Link href="/login">{loginLabel}</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border bg-card/70 p-4 backdrop-blur">
                    <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {[
                  "Borrower onboarding",
                  "Sanction workspace",
                  "Disbursement control",
                  "Collection tracking",
                  "Email and WhatsApp ready",
                ].map((item) => (
                  <span key={item} className="rounded-full border bg-card/80 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
              <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.6rem] border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-6">
                  <div className="w-full">
                    <div className="rounded-[1.6rem] bg-slate-950 p-6 text-slate-100">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                        <span>Loan Overview</span>
                        <span>Live</span>
                      </div>
                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {[
                          { label: "Disbursed", value: "₹18.4 Cr" },
                          { label: "Active Loans", value: "1,284" },
                          { label: "Approval Time", value: "24 hr" },
                          { label: "Collection Rate", value: "98.2%" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <p className="text-xs text-slate-400">{item.label}</p>
                            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500 p-5 text-white">
                        <p className="text-sm/6 opacity-90">Lifecycle</p>
                        <p className="mt-2 text-lg font-semibold">APPLIED → SANCTIONED → DISBURSED → CLOSED</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* New top sections order requested: Features, Workflow, Testimonials, FAQ */}
        <FeaturesSection items={null} />
        <WorkflowSection steps={null} />
        <TestimonialsSection items={null} />
        <FaqSection items={null} />

        <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Operational value</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">A platform designed around the real loan workflow</h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              The UI highlights the parts that matter to lending teams: speed, security, traceability, and a professional borrower-facing experience.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {valueCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} viewport={{ once: true }}>
                  <Card className="h-full border-white/40 bg-white/75 shadow-sm backdrop-blur dark:bg-slate-950/75">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="mt-4 text-xl">{card.title}</CardTitle>
                      <CardDescription className="leading-6">{card.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-white/40 bg-card/70 p-6 md:p-8">
              <CardHeader className="px-0 pt-0">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Workflow</p>
                <CardTitle className="mt-3 text-3xl">From lead to closure in a clear sequence</CardTitle>
                <CardDescription className="mt-3 text-base leading-7">
                  The journey is split into simple, visible stages so teams can operate quickly without losing control of the loan lifecycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="mt-6 grid gap-4">
                  {operationalSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="flex gap-4 rounded-2xl border bg-background/80 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Step {index + 1}</p>
                          <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/40 bg-card/70 p-6 md:p-8">
              <CardHeader className="px-0 pt-0">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Why teams choose it</p>
                <CardTitle className="mt-3 text-3xl">More than a dashboard</CardTitle>
                <CardDescription className="mt-3 text-base leading-7">
                  The product is built to support the complete operating model, not only the borrower side of the process.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="grid gap-4">
                  <div className="rounded-2xl border bg-background/80 p-4">
                    <p className="font-medium">Executive routing</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Sales, sanction, disbursement, and collection workflows are separated cleanly for faster decision-making.</p>
                  </div>
                  <div className="rounded-2xl border bg-background/80 p-4">
                    <p className="font-medium">Document visibility</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">The platform is designed around borrower files, loan status, and repayment evidence so reviews stay traceable.</p>
                  </div>
                  <div className="rounded-2xl border bg-background/80 p-4">
                    <p className="font-medium">Communication ready</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Email and WhatsApp flows already exist in the backend and are easy to extend for operational messaging.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Support</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Submit a query and get a mail response</h2>
              <p className="mt-4 max-w-xl text-muted-foreground leading-7">
                Use the form to send a name, email, and message directly to the configured support inbox. The backend returns a clear success or failure message after submission.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border bg-card/70 p-5">
                  <p className="font-medium">Who should use this</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Borrowers, sales leads, partner teams, or internal users who want to ask about onboarding, approvals, repayments, or deployment support.
                  </p>
                </div>
                <div className="rounded-2xl border bg-card/70 p-5">
                  <p className="font-medium">What happens next</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The form posts to the API, the message is emailed to the support inbox, and the page shows success or failure feedback immediately.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
              <ContactQueryForm />
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
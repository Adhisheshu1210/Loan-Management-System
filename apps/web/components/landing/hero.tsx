"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type HeroData = {
  title?: string;
  subtitle?: string;
  actions?: { loginLabel?: string } | null;
};

export function HeroSection({ data }: { data?: HeroData | null }) {
  return (
    <section className="relative overflow-hidden px-4 pt-16 md:px-6 md:pt-24">
      <div className="absolute inset-0 -z-10 bg-fintech-gradient opacity-10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-4 py-2 text-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Fast approvals with secure lifecycle automation
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
            {data?.title ?? "Smart Loan Management Platform"}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            {data?.subtitle ?? "Fast approvals, secure processing, and complete loan lifecycle management."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-2xl">
              <Link href="/borrower/apply">
                Apply for Loan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl">
              <Link href="/login">
                {data?.actions?.loginLabel ?? "Executive Login"}
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {[
              "JWT secured",
              "Role-based access",
              "Cloud-ready uploads",
              "Responsive fintech UI",
            ].map((item) => (
              <span key={item} className="rounded-full border bg-card px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
          <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-soft">
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
        </motion.div>
      </div>
    </section>
  );
}

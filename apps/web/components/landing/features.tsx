"use client";

import { CheckCircle2, FileLock2, Gauge, Landmark, MessageSquareMore, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type FeatureItem = { title: string; description?: string };
export function FeaturesSection({ items }: { items?: FeatureItem[] | null }) {
  const features =
    items && items.length
      ? items.map((it) => ({ icon: Landmark, title: it.title, description: it.description }))
      : [
          { icon: Landmark, title: "Easy Loan Application", description: "A smooth borrower journey with guided steps and live calculations." },
          { icon: Gauge, title: "Fast Verification", description: "Route-based executive queues for efficient review and turnaround." },
          { icon: FileLock2, title: "Secure Document Upload", description: "PDF and image uploads with Cloudinary or local storage fallback." },
          { icon: Workflow, title: "Live Loan Tracking", description: "Realtime lifecycle states with clear status badges and history." },
          { icon: CheckCircle2, title: "Executive Workflow Automation", description: "Role-driven actions for sanction, disbursement, and collections." },
          { icon: MessageSquareMore, title: "Real-time Payment Collection", description: "UTR validation, payment history, and auto-close logic." },
        ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Features</p>
        <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Everything a modern loan platform needs</h2>
      </motion.div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature: any, index: number) => {
          const Icon = feature.icon;
          return (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }}>
              <Card className="h-full border-white/40 bg-white/70 backdrop-blur dark:bg-slate-950/70">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

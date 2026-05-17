"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "10K+", label: "Loans Processed" },
  { value: "98%", label: "Customer Satisfaction" },
  { value: "24hr", label: "Approval System" },
  { value: "100%", label: "Secure" },
];

export function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }} viewport={{ once: true }} className="rounded-3xl border bg-card p-6 text-center shadow-soft">
            <p className="text-4xl font-semibold text-primary">{stat.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

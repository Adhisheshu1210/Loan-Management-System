"use client";

import { motion } from "framer-motion";

export function WorkflowSection({ steps }: { steps?: string[] | null }) {
  const localSteps = steps && steps.length ? steps : ["Register", "Submit Details", "Upload Documents", "Apply Loan", "Verification", "Sanction", "Disbursement", "Repayment", "Loan Closure"];
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Workflow</p>
        <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Clear lifecycle from onboarding to closure</h2>
      </motion.div>
      <div className="mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-3">
        {localSteps.map((step, index) => (
          <motion.div key={step} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }} className="rounded-2xl border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Step {index + 1}</p>
            <p className="mt-2 text-lg font-medium">{step}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

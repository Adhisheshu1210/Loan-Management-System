"use client";

import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { motion } from "framer-motion";

export function FaqSection({ items }: { items?: { q: string; a: string }[] | null }) {
  const faqs =
    items && items.length
      ? items
      : [
          {
            q: "How does BRE work?",
            a: "BRE runs on the backend for enforcement and on the frontend for UX. Age, salary, PAN, and employment mode are checked with clear rejection reasons.",
          },
          {
            q: "Can executives access all records?",
            a: "Role-based access controls limit each executive to their module, while ADMIN can access everything.",
          },
          {
            q: "How are uploads handled?",
            a: "Salary slips and proof documents can be stored in Cloudinary or locally when cloud credentials are not configured.",
          },
          {
            q: "Is the app deployment ready?",
            a: "Yes. The repo includes Docker, environment examples, CI, and deployment configuration for Vercel and Render/Railway.",
          },
        ];
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-20 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Frequently asked questions</h2>
      </motion.div>
      <Accordion>
        {faqs.map((item, index) => (
          <AccordionItem key={item.q} title={item.q} defaultOpen={index === 0}>
            {item.a}
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

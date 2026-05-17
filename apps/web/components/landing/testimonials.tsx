"use client";

import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type Testimonial = { name: string; role?: string; quote: string };
export function TestimonialsSection({ items }: { items?: Testimonial[] | null }) {
  const testimonials =
    items && items.length
      ? items
      : [
          { name: "Aarav Mehta", role: "Borrower", quote: "The application flow was clear and fast. I could track every step without chasing support." },
          { name: "Priya Shah", role: "Sales Executive", quote: "The role-based dashboard makes follow-up and pipeline management much easier." },
          { name: "Rahul Verma", role: "Collection Lead", quote: "Payments, UTR checks, and auto-close rules are all in one place now." },
        ];
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Testimonials</p>
        <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Built for borrowers and internal teams alike</h2>
      </motion.div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.div key={item.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }}>
            <Card className="h-full bg-card/80 backdrop-blur">
              <CardContent className="p-6">
                <Quote className="h-6 w-6 text-primary" />
                <p className="mt-4 text-base text-muted-foreground">{item.quote}</p>
                <div className="mt-6">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

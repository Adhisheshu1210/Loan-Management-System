"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Executive Login", href: "/login" },
  { label: "Apply for Loan", href: "/borrower/apply" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50 py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold">Loan Management System</h3>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Modern fintech-grade loan processing for borrowers, executives, and admins.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Contact</h4>
            <p className="mt-3 text-sm text-muted-foreground">angothuadhisheshu@gmail.com</p>
            <div className="mt-4 flex gap-3 text-muted-foreground">
              <a href="https://www.linkedin.com/in/angothu-adhisheshu-b8632733b" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="rounded-full border p-2 transition hover:bg-secondary">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/adhisheshu123?igsh=b3NvZG1kbHVxdXpu" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border p-2 transition hover:bg-secondary">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://x.com/AAngothu10974" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="rounded-full border p-2 transition hover:bg-secondary">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© 2026 Loan Management System. All rights reserved.</span>
          <span>Secure. Responsive. Production-ready.</span>
        </div>
      </div>
    </footer>
  );
}

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

export function AccordionItem({ title, children, defaultOpen = false }: React.PropsWithChildren<{ title: string; defaultOpen?: boolean }>) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border bg-card p-4">
      <button
        type="button"
        suppressHydrationWarning
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="pt-4 text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}

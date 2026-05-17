"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select suppressHydrationWarning className={cn("h-11 w-full rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", className)} {...props}>
      {children}
    </select>
  );
}

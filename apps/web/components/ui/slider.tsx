"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Slider({ value, min, max, step = 1, onChange, className }: { value: number; min: number; max: number; step?: number; onChange: (value: number) => void; className?: string }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn("h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary", className)}
    />
  );
}

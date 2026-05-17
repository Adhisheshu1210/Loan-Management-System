"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

type ModuleHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFit?: "cover" | "contain";
  className?: string;
};

export function ModuleHero({ eyebrow, title, description, imageSrc, imageAlt, imageFit = "cover", className }: ModuleHeroProps) {
  return (
    <Card className={className ?? "overflow-hidden border-0"}>
      <CardContent className="grid gap-6 p-0 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="relative h-44 md:h-full">
          <Image src={imageSrc} alt={imageAlt} fill priority className={imageFit === "contain" ? "object-contain p-4" : "object-cover"} />
        </div>
      </CardContent>
    </Card>
  );
}
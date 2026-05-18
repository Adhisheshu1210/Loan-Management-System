"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted && theme === "dark";

  return (
    <Button variant="secondary" size="sm" onClick={() => setTheme(isDarkTheme ? "light" : "dark")}>
      {mounted ? (
        isDarkTheme ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />
      ) : (
        <MoonStar className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="ml-2 hidden sm:inline">{mounted ? (isDarkTheme ? "Light" : "Dark") : "Theme"}</span>
    </Button>
  );
}

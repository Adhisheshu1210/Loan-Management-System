import { LandingPage } from "@/components/landing/landing-page";

async function fetchLanding() {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${api}/public/landing`, { cache: "force-cache", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function HomePage() {
  const landing = await fetchLanding();
  return <LandingPage landing={landing?.data ?? null} />;
}

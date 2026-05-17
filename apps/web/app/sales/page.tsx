import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ExecutiveFeaturePage } from "@/components/executive/executive-feature-page";

export default function SalesPage() {
  return (
    <ExecutiveShell role="SALES" section="home">
      <ExecutiveFeaturePage role="SALES" feature="home" />
    </ExecutiveShell>
  );
}
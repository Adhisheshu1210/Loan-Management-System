import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ExecutiveFeaturePage } from "@/components/executive/executive-feature-page";

export default function SanctionPage() {
  return (
    <ExecutiveShell role="SANCTION" section="home">
      <ExecutiveFeaturePage role="SANCTION" feature="home" />
    </ExecutiveShell>
  );
}
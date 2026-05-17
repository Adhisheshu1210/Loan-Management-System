import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ExecutiveFeaturePage } from "@/components/executive/executive-feature-page";

export default function DisbursementPage() {
  return (
    <ExecutiveShell role="DISBURSEMENT" section="home">
      <ExecutiveFeaturePage role="DISBURSEMENT" feature="home" />
    </ExecutiveShell>
  );
}
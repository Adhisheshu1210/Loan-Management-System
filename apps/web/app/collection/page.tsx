import { ExecutiveShell } from "@/components/executive/executive-shell";
import { ExecutiveFeaturePage } from "@/components/executive/executive-feature-page";

export default function CollectionPage() {
  return (
    <ExecutiveShell role="COLLECTION" section="home">
      <ExecutiveFeaturePage role="COLLECTION" feature="home" />
    </ExecutiveShell>
  );
}
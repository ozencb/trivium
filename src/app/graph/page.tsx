import { ConceptGraph } from "@/components/concept-graph";

export const dynamic = "force-dynamic";

export default function GraphPage() {
  return (
    <div className="h-screen w-full">
      <ConceptGraph />
    </div>
  );
}

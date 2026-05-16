import { ConceptGraph } from "@/components/concept-graph";

export const dynamic = "force-dynamic";

export default function GraphPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full">
      <ConceptGraph />
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { ALL_ROLES, ALL_LENSES } from "@/lib/constants";
import type { Role, Lens } from "@/lib/types";

interface FilterControlsProps {
  selectedRoles: Role[];
  selectedLenses: Lens[];
  onRolesChange: (roles: Role[]) => void;
  onLensesChange: (lenses: Lens[]) => void;
}

export function FilterControls({
  selectedRoles,
  selectedLenses,
  onRolesChange,
  onLensesChange,
}: FilterControlsProps) {
  function toggleRole(role: Role) {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter(r => r !== role));
    } else {
      onRolesChange([...selectedRoles, role]);
    }
  }

  function toggleLens(lens: Lens) {
    if (selectedLenses.includes(lens)) {
      onLensesChange(selectedLenses.filter(l => l !== lens));
    } else {
      onLensesChange([...selectedLenses, lens]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Role</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by role">
          {ALL_ROLES.map(role => (
            <button
              key={role}
              type="button"
              aria-pressed={selectedRoles.includes(role)}
              onClick={() => toggleRole(role)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <Badge
                variant={selectedRoles.includes(role) ? "default" : "outline"}
                className="cursor-pointer"
              >
                {role}
              </Badge>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Lens</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by lens">
          {ALL_LENSES.map(lens => (
            <button
              key={lens}
              type="button"
              aria-pressed={selectedLenses.includes(lens)}
              onClick={() => toggleLens(lens)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <Badge
                variant={selectedLenses.includes(lens) ? "default" : "outline"}
                className="cursor-pointer"
              >
                {lens}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

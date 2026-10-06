import type { Check } from "@/lib/domain/types";

export function checkLabel(c: Check) {
  const names: Record<string, string> = {
    cad_validity: "CAD solid validity",
    unit_bounds_sanity: "Geometry and units",
    locked_constraints: "Locked placements",
    base_lid_intersection: "Base and lid overlap",
    wall_parameter: "Minimum wall thickness",
    closure_fit: "Closure fit",
    thermal: "Heat and ventilation",
    electrical: "Electrical safety",
    strength: "Structural strength",
    slicing: "Slicer settings",
  };
  const suffixes: Record<string, string> = {
    lid_clearance: "Space under the lid",
    containment: "Fits inside the enclosure",
    shell_intersection: "Clear of enclosure walls",
    keepout: "Reserved space",
    printer_bounds: "Fits the printer volume",
    overlap: "Parts do not overlap",
  };
  const suffix = Object.keys(suffixes).find((key) => c.id.endsWith(`_${key}`));
  const label = names[c.id] ?? (suffix ? suffixes[suffix] : c.name);
  return label;
}

import type { PropertyInput } from "@/types";

export function encodeAnalysisUrl(input: PropertyInput, mode: "buy" | "sell"): string {
  const base = mode === "sell" ? "/sell" : "/buy";
  const params = new URLSearchParams();
  params.set("t", input.town);
  params.set("f", input.flatType);
  if (input.streetName) params.set("s", input.streetName);
  if (input.block) params.set("b", input.block);
  if (input.storeyRange) params.set("st", input.storeyRange);
  if (input.floorAreaSqm) params.set("a", String(input.floorAreaSqm));
  return `${base}?${params.toString()}`;
}

export function decodeAnalysisUrl(searchParams: URLSearchParams): Partial<PropertyInput> | null {
  const town = searchParams.get("t");
  if (!town) return null;
  return {
    town,
    flatType: searchParams.get("f") || undefined,
    streetName: searchParams.get("s") || undefined,
    block: searchParams.get("b") || undefined,
    storeyRange: searchParams.get("st") || undefined,
    floorAreaSqm: searchParams.get("a") ? Number(searchParams.get("a")) : undefined,
  };
}

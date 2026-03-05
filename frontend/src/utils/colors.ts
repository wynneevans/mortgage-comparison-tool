export const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#be185d", "#4d7c0f", "#9333ea", "#ea580c",
];

/** Pick the lowest-index color not currently in use. */
export function nextColor(usedColors: string[]): string {
  return COLORS.find((c) => !usedColors.includes(c)) ?? COLORS[usedColors.length % COLORS.length];
}

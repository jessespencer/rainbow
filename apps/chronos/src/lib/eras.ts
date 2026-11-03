/**
 * Era band definitions — used for background bands in the lane area
 * and the minimap. Colors are at full saturation here; consumers
 * apply their own opacity.
 */

export interface EraBand {
  name: string;
  startYear: number;
  endYear: number;
  /** A dark tint at one of a few close lightnesses; warm eras stay low in colour so they don't turn brown on Deep Night. */
  color: string;
}

export const ERA_BANDS: EraBand[] = [
  { name: "Primeval",              startYear: -4100, endYear: -2348, color: "#2a294b" },
  { name: "Patriarchal",           startYear: -2348, endYear: -1491, color: "#3e2f25" },
  { name: "Exodus & Wilderness",   startYear: -1491, endYear: -1400, color: "#3c3425" },
  { name: "Judges",                startYear: -1400, endYear: -1050, color: "#2d3322" },
  { name: "United Monarchy",       startYear: -1050, endYear: -931,  color: "#34294b" },
  { name: "Divided Kingdom",       startYear: -931,  endYear: -586,  color: "#232d45" },
  { name: "Exile",                 startYear: -586,  endYear: -538,  color: "#1f2938" },
  { name: "Second Temple",         startYear: -538,  endYear: -4,    color: "#392e22" },
  { name: "Messianic",             startYear: -4,    endYear: 50,    color: "#423a25" },
];

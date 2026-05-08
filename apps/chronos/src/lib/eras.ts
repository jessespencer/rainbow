/**
 * Era band definitions — used for background bands in the lane area
 * and the minimap. Colors are at full saturation here; consumers
 * apply their own opacity.
 */

export interface EraBand {
  name: string;
  startYear: number;
  endYear: number;
  color: string;
}

export const ERA_BANDS: EraBand[] = [
  { name: "Primeval",              startYear: -4100, endYear: -2348, color: "#2a2854" },
  { name: "Patriarchal",           startYear: -2348, endYear: -1491, color: "#5c3d28" },
  { name: "Exodus & Wilderness",   startYear: -1491, endYear: -1400, color: "#6b5a3a" },
  { name: "Judges",                startYear: -1400, endYear: -1050, color: "#4a5436" },
  { name: "United Monarchy",       startYear: -1050, endYear: -931,  color: "#3d2d5c" },
  { name: "Divided Kingdom",       startYear: -931,  endYear: -586,  color: "#2e3648" },
  { name: "Exile",                 startYear: -586,  endYear: -538,  color: "#282d34" },
  { name: "Second Temple",         startYear: -538,  endYear: -4,    color: "#4a4028" },
  { name: "Messianic",             startYear: -4,    endYear: 50,    color: "#443e30" },
];

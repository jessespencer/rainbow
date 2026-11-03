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
  /** Day's: a pale wash of the same hue on parchment. */
  wash: string;
}

export const ERA_BANDS: EraBand[] = [
  { name: "Primeval",              startYear: -4100, endYear: -2348, color: "#2a294b", wash: "#dfe0fa" },
  { name: "Patriarchal",           startYear: -2348, endYear: -1491, color: "#3e2f25", wash: "#f1dfd4" },
  { name: "Exodus & Wilderness",   startYear: -1491, endYear: -1400, color: "#3c3425", wash: "#ebe2d1" },
  { name: "Judges",                startYear: -1400, endYear: -1050, color: "#2d3322", wash: "#dfe6d3" },
  { name: "United Monarchy",       startYear: -1050, endYear: -931,  color: "#34294b", wash: "#e5def8" },
  { name: "Divided Kingdom",       startYear: -931,  endYear: -586,  color: "#232d45", wash: "#d8e3fb" },
  { name: "Exile",                 startYear: -586,  endYear: -538,  color: "#1f2938", wash: "#d8e4f6" },
  { name: "Second Temple",         startYear: -538,  endYear: -4,    color: "#392e22", wash: "#eee1d3" },
  { name: "Messianic",             startYear: -4,    endYear: 50,    color: "#423a25", wash: "#ebe2cc" },
];

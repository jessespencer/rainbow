/**
 * Coordinate-scaling utilities for the horizontal timeline.
 *
 * The timeline maps signed-integer years (BC negative, AD positive)
 * to pixel offsets. The number line is treated as continuous — the
 * missing year 0 occupies ~2 px and is visually negligible at scale.
 */

export const PIXELS_PER_YEAR = 2;
export const MIN_YEAR = -4100;
export const MAX_YEAR = 50;

/** Total pixel width of the rendered timeline. */
export const TIMELINE_WIDTH = (MAX_YEAR - MIN_YEAR) * PIXELS_PER_YEAR;

/** Convert a signed year to a pixel offset from the left edge. */
export const yearToX = (year: number): number =>
  (year - MIN_YEAR) * PIXELS_PER_YEAR;

/** Convert a pixel offset back to a signed year (inverse of yearToX). */
export const xToYear = (x: number): number =>
  x / PIXELS_PER_YEAR + MIN_YEAR;

/** Format a signed year for display: "4004 BC", "33 AD". */
export const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year > 0) return `${year} AD`;
  return "1 BC"; // year 0 doesn't exist; label it as 1 BC
};

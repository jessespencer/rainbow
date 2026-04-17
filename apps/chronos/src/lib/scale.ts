/**
 * Coordinate-scaling utilities for the horizontal timeline.
 *
 * The timeline maps signed-integer years (BC negative, AD positive)
 * to pixel offsets. pixelsPerYear is mutable to support zoom.
 */

export const MIN_YEAR = -4100;
export const MAX_YEAR = 50;

const DEFAULT_PPY = 3;

let pixelsPerYear = DEFAULT_PPY;

export const getPixelsPerYear = (): number => pixelsPerYear;

export const setPixelsPerYear = (ppy: number): void => {
  pixelsPerYear = ppy;
};

export const getDefaultPPY = (): number => DEFAULT_PPY;

export const getTimelineWidth = (): number =>
  (MAX_YEAR - MIN_YEAR) * pixelsPerYear;

/** Convert a signed year to a pixel offset from the left edge. */
export const yearToX = (year: number): number =>
  (year - MIN_YEAR) * pixelsPerYear;

/** Convert a pixel offset back to a signed year (inverse of yearToX). */
export const xToYear = (x: number): number =>
  x / pixelsPerYear + MIN_YEAR;

/** Format a signed year for display: "4004 BC", "33 AD". */
export const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year > 0) return `${year} AD`;
  return "1 BC";
};

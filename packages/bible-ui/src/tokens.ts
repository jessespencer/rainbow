/**
 * Design tokens for code that draws: canvas, SVG and WebGL can't use var(),
 * so they read the same custom properties the CSS uses.
 */

const cache = new Map<string, string>();

/** The value of a custom property on :root, such as `cssToken("--bg-base")`. */
export const cssToken = (name: string): string => {
  let value = cache.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    // An empty answer means the stylesheet hasn't applied yet, so ask again next time.
    if (value) cache.set(name, value);
  }
  return value;
};

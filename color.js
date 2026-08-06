import {
  Cam16,
  ViewingConditions,
  yFromLstar,
  redFromArgb,
  greenFromArgb,
  blueFromArgb,
  linearized,
} from "@material/material-color-utilities";

/**
 * HCT and OKLCH are both cylindrical perceptual spaces, but they are not the
 * same space: HCT takes hue and chroma from CAM16 and tone from CIE L*, while
 * OKLCH is the polar form of Oklab. Their hue angles disagree by up to ~19
 * degrees in the blues and their chroma scales differ by a factor of ~400, so
 * the coordinates cannot be renamed into each other. Everything here converts
 * rather than reinterprets.
 */

/**
 * The gamut colors are fitted into. Material's own solver only ever targets
 * sRGB, so anything wider is where this module earns its keep.
 * @typedef {"srgb" | "display-p3" | "rec2020"} Gamut
 */

/**
 * XYZ (D65) to linear RGB, per gamut. The sRGB matrix is the one
 * material-color-utilities uses internally, so an in-gamut color resolves to
 * the same value it would have had going through `Hct.toInt`.
 * @type {Record<Gamut, number[][]>}
 */
const xyzToLinearRgb = {
  srgb: [
    [3.2413774792388685, -1.5376652402851851, -0.49885366846268053],
    [-0.9691452513005321, 1.8758853451067872, 0.04156585616912061],
    [0.05562093689691305, -0.20395524564742123, 1.0571799111220335],
  ],
  "display-p3": [
    [2.4934969119414263, -0.9313836179191241, -0.40271078445071684],
    [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
    [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
  ],
  rec2020: [
    [1.7166511879712674, -0.3556707837763924, -0.2533662813736599],
    [-0.6666843518324892, 1.6164812366349395, 0.01576854581391113],
    [0.017639857445310783, -0.042770613257808524, 0.9421031212354739],
  ],
};

/** @type {Gamut[]} */
export const gamuts = /** @type {Gamut[]} */ (Object.keys(xyzToLinearRgb));

/** @type {Gamut} */
export const defaultGamut = "srgb";

const viewingConditions = ViewingConditions.DEFAULT;

/** @type {Map<string, string>} */
const cache = new Map();

/**
 * The largest CAM16 chroma worth searching. Real gamuts top out well below
 * this; the bound only keeps the search finite.
 */
const maximumChroma = 200;

/**
 * Converts unclamped linear sRGB to Oklab. Components outside 0..1 are
 * meaningful here: they are how a color wider than sRGB is expressed, and
 * `Math.cbrt` is defined for negatives.
 * @param {number[]} linearRgb
 * @returns {[l: number, a: number, b: number]}
 */
function oklabFromLinearRgb([red, green, blue]) {
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );

  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ];
}

/**
 * @param {number[]} linearRgb
 * @returns {[lightness: number, chroma: number, hue: number]}
 */
function oklchFromLinearRgb(linearRgb) {
  const [lightness, a, b] = oklabFromLinearRgb(linearRgb);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;

  return [lightness, Math.hypot(a, b), hue < 0 ? hue + 360 : hue];
}

/**
 * Converts XYZ (on material-color-utilities' 0..100 scale) to linear RGB in the
 * given gamut, without clamping so the caller can tell whether it fits.
 * @param {number[]} xyz
 * @param {Gamut} gamut
 * @returns {number[]}
 */
function linearRgbFromXyz([x, y, z], gamut) {
  return xyzToLinearRgb[gamut].map(
    (row) => (row[0] * x + row[1] * y + row[2] * z) / 100,
  );
}

/** Room for floating point error when testing gamut boundaries */
const epsilon = 1e-7;

/**
 * @param {number[]} linearRgb
 * @returns {boolean}
 */
function isInGamut(linearRgb) {
  return linearRgb.every(
    (component) =>
      Number.isFinite(component) &&
      component >= -epsilon &&
      component <= 1 + epsilon,
  );
}

/**
 * The Y a CAM16 color with this lightness, chroma and hue resolves to.
 * @param {number} lightness CAM16 J
 * @param {number} chroma
 * @param {number} hue
 * @returns {number}
 */
function yFromCam16(lightness, chroma, hue) {
  return Cam16.fromJchInViewingConditions(
    lightness,
    chroma,
    hue,
    viewingConditions,
  ).xyzInViewingConditions(viewingConditions)[1];
}

/**
 * Converts an HCT triple to XYZ without constraining it to any gamut.
 *
 * HCT's tone is CIE L*, but CAM16 is parameterised by its own lightness J, and
 * J depends on chroma and hue as well as luminance. There is no closed form for
 * the one from the other, so J is bisected until the color lands on the Y the
 * requested tone asks for. This is the same invariant `HctSolver` holds, which
 * is what keeps Material's contrast guarantees intact: they are expressed in
 * tone, and tone is preserved exactly.
 * @param {number} hue
 * @param {number} chroma
 * @param {number} tone
 * @returns {number[]} XYZ on the 0..100 scale
 */
function xyzFromHct(hue, chroma, tone) {
  const targetY = yFromLstar(tone);
  if (targetY <= 0) return [0, 0, 0];

  // Y increases with J at a fixed chroma and hue, so the target is bracketed.
  let low = 0;
  let high = 100;
  // A chromatic color needs a higher J than white to reach white's luminance,
  // so the upper bound occasionally has to grow.
  while (high < 1e4 && yFromCam16(high, chroma, hue) < targetY) high *= 2;

  for (let iteration = 0; iteration < 64 && high - low > 1e-9; iteration++) {
    const middle = (low + high) / 2;
    if (yFromCam16(middle, chroma, hue) < targetY) low = middle;
    else high = middle;
  }

  return Cam16.fromJchInViewingConditions(
    (low + high) / 2,
    chroma,
    hue,
    viewingConditions,
  ).xyzInViewingConditions(viewingConditions);
}

/**
 * Finds the most chromatic color of this hue and tone that fits in the gamut,
 * giving up chroma but never tone. Mirrors what `HctSolver` does for sRGB.
 *
 * The gamut decides only how much chroma survives. The color itself is always
 * carried as XYZ, because Oklab is defined off linear sRGB and feeding it
 * another gamut's primaries would silently reinterpret the color.
 * @param {number} hue
 * @param {number} chroma
 * @param {number} tone
 * @param {Gamut} gamut
 * @returns {number[]} XYZ on the 0..100 scale
 */
function solveToXyz(hue, chroma, tone, gamut) {
  const requested = xyzFromHct(hue, chroma, tone);
  if (isInGamut(linearRgbFromXyz(requested, gamut))) return requested;

  // Tone alone is always achievable: chroma 0 is the neutral of that tone.
  let low = 0;
  let high = Math.min(chroma, maximumChroma);
  let answer = xyzFromHct(hue, 0, tone);

  // 0.01 chroma is far below a perceptible step and below what 10 bits resolve
  for (let iteration = 0; iteration < 24 && high - low > 0.01; iteration++) {
    const middle = (low + high) / 2;
    const candidate = xyzFromHct(hue, middle, tone);
    if (isInGamut(linearRgbFromXyz(candidate, gamut))) {
      answer = candidate;
      low = middle;
    } else {
      high = middle;
    }
  }

  return answer;
}

/**
 * Rounds to at most `digits` decimals and drops trailing zeroes so the CSS
 * stays readable. Five decimals on lightness and chroma and two on hue round
 * trip every sRGB color exactly; four leaves some off by 1/255.
 * @param {number} value
 * @param {number} digits
 * @returns {string}
 */
function format(value, digits) {
  return String(Number(value.toFixed(digits)));
}

/**
 * @param {[lightness: number, chroma: number, hue: number]} oklch
 * @returns {string}
 */
function toCss([lightness, chroma, hue]) {
  // A neutral has no meaningful hue angle, and omitting it avoids noise in the
  // output when the source color is grey
  if (chroma < 5e-6) return `oklch(${format(lightness, 5)} 0 0)`;

  return `oklch(${format(lightness, 5)} ${format(chroma, 5)} ${format(hue, 2)})`;
}

/**
 * Converts a resolved sRGB color to an `oklch()` value. Used for colors that
 * material-color-utilities has already fitted into sRGB.
 * @param {number} argb
 * @returns {string}
 */
export function oklchFromArgb(argb) {
  return toCss(
    oklchFromLinearRgb([
      linearized(redFromArgb(argb)) / 100,
      linearized(greenFromArgb(argb)) / 100,
      linearized(blueFromArgb(argb)) / 100,
    ]),
  );
}

/**
 * Converts an HCT triple to an `oklch()` value, fitted to `gamut` rather than
 * to sRGB. This is the point of the whole module: `Hct.toInt` always clips to
 * sRGB, so going through it throws away chroma a P3 display could have shown.
 * @param {number} hue
 * @param {number} chroma
 * @param {number} tone
 * @param {Gamut} gamut
 * @returns {string}
 */
export function oklchFromHct(hue, chroma, tone, gamut) {
  // The eight contrast schemes share their palettes, so the same triple comes
  // up many times over one theme and the nested solves are worth caching
  const key = `${hue}|${chroma}|${tone}|${gamut}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const xyz = solveToXyz(hue, chroma, tone, gamut);

  // Always via linear sRGB: that is the space Oklab is defined against, and
  // components outside 0..1 are exactly how a wider-than-sRGB color is carried.
  const css = toCss(oklchFromLinearRgb(linearRgbFromXyz(xyz, "srgb")));
  cache.set(key, css);

  return css;
}

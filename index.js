import {
  argbFromHex,
  hexFromArgb,
  TonalPalette,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  Hct,
  MaterialDynamicColors,
  DynamicColor,
} from "@material/material-color-utilities";
import plugin from "tailwindcss/plugin.js";

import defaultConfiguration from "./default.config.js";
import { defaultGamut, gamuts, oklchFromArgb, oklchFromHct } from "./color.js";

/**
 * @import {DynamicScheme} from "@material/material-color-utilities"
 * @import {Gamut} from "./color.js"
 */

/**
 * The scheme styles Material provides, keyed by the name used in the plugin
 * options. These are the "styles" in the Material Theme Builder.
 * @see https://material-foundation.github.io/material-theme-builder/
 */
const variants = {
  monochrome: SchemeMonochrome,
  neutral: SchemeNeutral,
  "tonal-spot": SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  rainbow: SchemeRainbow,
  "fruit-salad": SchemeFruitSalad,
};

/** @typedef {keyof typeof variants} VariantName */

/** @type {VariantName} */
const defaultVariant = "tonal-spot";

/**
 * The color spec versions material-color-utilities implements. "2025" is the
 * Material 3 Expressive spec and adds the "dim" colors.
 * `SpecVersion` itself is not re-exported from the package root, so the union
 * is declared here.
 * @typedef {"2021" | "2025"} SpecVersion
 */

/**
 * Typed as strings so an unvalidated option can be checked against it
 * @type {string[]}
 */
const specVersions = ["2021", "2025"];

/** @type {SpecVersion} */
const defaultSpecVersion = "2021";

//TODO update Tailwind CSS to a version after 4.0.6 to fix types
/**
 * @import {Config} from "tailwindcss"
 */

/**
 * Convert camelCase to kebab-case
 * e.g. "neutralVariant" -> "neutral-variant"
 * @param {string} value
 * @returns {string}
 */
function camelToKebabCase(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 *
 * @param {TonalPalette} palette
 * @param {Gamut} gamut
 * @returns {Generator<[number, string]>}
 */
function* generatePaletteSteps(palette, gamut) {
  // Supported color steps
  // Material Design goes from 0 to 100 for lightness (like percent)
  // whereas Tailwind goes from 50 to 950
  // We support material way of thinking here

  // Create Tonal pallettes
  // See https://m3.material.io/styles/color/system/how-the-system-works#3ce9da92-a118-4692-8b2c-c5c52a413fa6
  // And https://material-foundation.github.io/material-theme-builder/
  //TODO check out tailwind dynamic color values and/or make configurable
  const materialPalletteSteps = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100,
  ];

  for (const step of materialPalletteSteps) {
    yield [step, resolvePaletteStep(palette, step, gamut)];
  }
}

/**
 * TonalPalette averages tones 98 and 100 for tone 99 of a yellow palette,
 * which is an sRGB operation and not an HCT triple we could re-solve in a
 * wider gamut. It lands next to white with almost no chroma, so nothing is
 * lost by taking the sRGB answer for it.
 * @param {TonalPalette} palette
 * @param {number} tone
 * @returns {boolean}
 */
function isAveragedTone(palette, tone) {
  return tone === 99 && Hct.isYellow(palette.hue);
}

/**
 * @param {TonalPalette} palette
 * @param {number} tone
 * @param {Gamut} gamut
 * @returns {string}
 */
function resolvePaletteStep(palette, tone, gamut) {
  if (gamut === "srgb") return hexFromArgb(palette.tone(tone));
  if (isAveragedTone(palette, tone)) return oklchFromArgb(palette.tone(tone));

  return oklchFromHct(palette.hue, palette.chroma, tone, gamut);
}

/** @typedef {[name: string, palette: TonalPalette][]} PaletteArray */
/**
 *
 * @param {PaletteArray} materialPalettes
 * @param {Gamut} gamut
 */
function createPalettes(materialPalettes, gamut) {
  /** @type {Record<string, string>} */
  const palettes = {};
  for (let [name, palette] of materialPalettes) {
    name = camelToKebabCase(name);

    for (const [step, color] of generatePaletteSteps(palette, gamut)) {
      palettes[`${name}-${step}`] = color;
    }
  }

  return palettes;
}

/**
 * The color accessors on MaterialDynamicColors. Every one of them is a method
 * taking no arguments that returns the DynamicColor for the scheme's spec
 * version, except `highestSurface`, which is a lookup helper taking a scheme,
 * and `allColors`, which is an array. `allColors` is an instance field rather
 * than a prototype member, so it only has to be excluded for the type.
 * @typedef {Exclude<keyof MaterialDynamicColors, "highestSurface" | "allColors">} ColorName
 */

/**
 * The deprecated statics on MaterialDynamicColors are deliberately not used
 * here. They only cover the 2021 spec and would silently omit the "dim" colors.
 * @type {ColorName[]}
 */
const colorNames = /** @type {ColorName[]} */ (
  Object.getOwnPropertyNames(MaterialDynamicColors.prototype).filter(
    (name) => name !== "constructor" && name !== "highestSurface",
  )
);

/**
 * Resolves a color for a scheme, or undefined when the color does not exist in
 * that scheme's spec version (e.g. the "dim" colors before "2025").
 * @param {DynamicScheme} scheme
 * @param {ColorName} name
 * @param {Gamut} gamut
 * @returns {string | undefined}
 */
function resolveColor(scheme, name, gamut) {
  const color = scheme.colors[name]();
  if (!(color instanceof DynamicColor)) return undefined;

  if (gamut === "srgb") return hexFromArgb(scheme.getArgb(color));

  // The 2021 spec resolves through TonalPalette, so it inherits the averaged
  // tone 99 of a yellow palette
  if (
    scheme.specVersion !== "2025" &&
    isAveragedTone(color.palette(scheme), color.getTone(scheme))
  )
    return oklchFromArgb(scheme.getArgb(color));

  return oklchFromHct(...requestedHct(scheme, color), gamut);
}

/**
 * The hue, chroma and tone a dynamic color asks for, before `Hct.toInt` fits it
 * into sRGB. Going through the resolved ARGB instead would mean re-reading a
 * color chroma has already been clipped out of, so the wider gamut would have
 * nothing left to give back.
 *
 * This mirrors what the two spec versions' calculation delegates do: 2021 takes
 * the palette's own chroma, 2025 scales it by the color's chroma multiplier.
 * @param {DynamicScheme} scheme
 * @param {DynamicColor} color
 * @returns {[hue: number, chroma: number, tone: number]}
 */
function requestedHct(scheme, color) {
  const palette = color.palette(scheme);
  const tone = color.getTone(scheme);

  if (scheme.specVersion === "2025") {
    const multiplier = color.chromaMultiplier?.(scheme) ?? 1;
    return [palette.hue, palette.chroma * multiplier, tone];
  }

  return [palette.hue, palette.chroma, tone];
}

/**
 * Creates colors
 * @param {Schemes} schemes
 * @param {Gamut} gamut
 * @returns {Record<string, string | Record<string, string>>}
 */
function createColors(schemes, gamut) {
  /** @type {Record<string, string | Record<string, string> >} */
  const colors = {};

  for (const [schemeName, scheme] of Object.entries(schemes)) {
    /** @type {Record<string,string>} */
    const schemeColors = {};

    for (const name of colorNames) {
      const color = resolveColor(scheme, name, gamut);
      if (color === undefined) continue;

      schemeColors[camelToKebabCase(name)] = color;
    }

    colors[camelToKebabCase(schemeName)] = schemeColors;
  }

  /**
   * The contrast levels, as the prefix they get in the color name and the pair
   * of schemes the `light-dark()` value is built from
   * @type {[prefix: string, light: SchemeName, dark: SchemeName][]}
   */
  const contrasts = [
    ["", "light", "dark"],
    ["reduced-contrast-", "light-reduced-contrast", "dark-reduced-contrast"],
    ["medium-contrast-", "light-medium-contrast", "dark-medium-contrast"],
    ["high-contrast-", "light-high-contrast", "dark-high-contrast"],
  ];

  for (const name of colorNames) {
    for (const [prefix, light, dark] of contrasts) {
      const lightColor = resolveColor(schemes[light], name, gamut);
      const darkColor = resolveColor(schemes[dark], name, gamut);
      if (lightColor === undefined || darkColor === undefined) continue;

      colors[`${prefix}${camelToKebabCase(name)}`] =
        `light-dark(${lightColor}, ${darkColor})`;
    }
  }

  return colors;
}

/**
 * @typedef {"light" | "dark"} Scheme
 * @typedef {"reduced" | "medium" | "high"} Contrast
 * @typedef {Scheme | `${Scheme}-${Contrast}-contrast`} SchemeName
 * @typedef {Record<SchemeName, DynamicScheme>} Schemes
 */

/**
 * Using contrast values as recommended by https://github.com/material-foundation/material-color-utilities/blob/9889de141b3b5194b8574f9e378e55f4428bdb5e/dev_guide/creating_color_scheme.md
 *
 * @param {string} sourceColor
 * @param {VariantName} variant
 * @param {SpecVersion} specVersion
 * @returns {Schemes}
 */
function createSchemes(sourceColor, variant, specVersion) {
  const color = Hct.fromInt(argbFromHex(sourceColor));
  const Scheme = variants[variant];

  return {
    "light-reduced-contrast": new Scheme(color, false, -1, specVersion),
    light: new Scheme(color, false, 0, specVersion),
    "light-medium-contrast": new Scheme(color, false, 0.5, specVersion),
    "light-high-contrast": new Scheme(color, false, 1, specVersion),
    "dark-reduced-contrast": new Scheme(color, true, -1, specVersion),
    dark: new Scheme(color, true, 0, specVersion),
    "dark-medium-contrast": new Scheme(color, true, 0.5, specVersion),
    "dark-high-contrast": new Scheme(color, true, 1, specVersion),
  };
}

/**
 * @param {string} sourceColor
 * @param {VariantName} variant
 * @param {SpecVersion} specVersion
 * @param {Gamut} gamut
 */
function createTheme(sourceColor, variant, specVersion, gamut) {
  const schemes = createSchemes(sourceColor, variant, specVersion);
  const colors = createColors(schemes, gamut);

  // The palettes are the same for light and dark
  /** @type {PaletteArray} */
  const sourcePalettes = Object.entries(schemes.light)
    .filter(([, value]) => value instanceof TonalPalette)
    // Remove "palette" postfix
    .map(([key, value]) => [key.replace("Palette", ""), value]);

  const palettes = createPalettes(sourcePalettes, gamut);

  const tailwindTheme = defaultConfiguration;

  // The source color is an sRGB hex the user gave us, so there is no wider
  // gamut version of it to recover. It is only restated in the theme's format.
  const source =
    gamut === "srgb" ? sourceColor : oklchFromArgb(argbFromHex(sourceColor));

  // Set colors
  tailwindTheme.extend = {
    ...tailwindTheme.extend,
    colors: {
      source,
      ...colors,
      ...palettes,
    },
  };

  return tailwindTheme;
}

class PluginOptionsUndefinedError extends Error {
  constructor() {
    super(
      "Please configure a source color in your Tailwind CSS file to use @claas.dev/material-tailwind e.g. `@plugin '@claas.dev/material-tailwind' { source-color: '#0c1445' }`",
    );
  }
}

class SourceColorUndefinedError extends Error {
  constructor() {
    super(
      "Please configure a source color in your Tailwind CSS file to use @claas.dev/material-tailwind e.g. `@plugin '@claas.dev/material-tailwind' { source-color: '#0c1445' }`",
    );
  }
}

class UnknownVariantError extends Error {
  /** @param {string} variant */
  constructor(variant) {
    super(
      `"${variant}" is not a Material scheme variant. Pick one of: ${Object.keys(variants).join(", ")}.`,
    );
  }
}

class UnknownSpecVersionError extends Error {
  /** @param {string} specVersion */
  constructor(specVersion) {
    super(
      `"${specVersion}" is not a Material color spec version. Pick one of: ${specVersions.join(", ")}.`,
    );
  }
}

class UnknownGamutError extends Error {
  /** @param {string} gamut */
  constructor(gamut) {
    super(
      `"${gamut}" is not a supported gamut. Pick one of: ${gamuts.join(", ")}.`,
    );
  }
}

/**
 * Aliases accepted for a gamut, so the CSS can say what reads naturally. A Map
 * rather than an object so a name like "constructor" misses instead of
 * resolving to something inherited.
 * @type {Map<string, Gamut>}
 */
const gamutAliases = new Map(
  /** @type {[string, Gamut][]} */ ([
    ["srgb", "srgb"],
    ["s-rgb", "srgb"],
    ["p3", "display-p3"],
    ["display-p3", "display-p3"],
    ["displayp3", "display-p3"],
    ["rec2020", "rec2020"],
    ["rec-2020", "rec2020"],
  ]),
);

/**
 * Reads the first of `names` that is set in the options
 * @param {Record<string, unknown>} options
 * @param {string[]} names
 * @returns {string | undefined}
 */
function readOption(options, names) {
  for (const name of names) {
    if (!(name in options)) continue;

    const value = options[name];
    // Tailwind parses unquoted values in `@plugin`, so a spec version like
    // 2025 arrives as a number
    if (value !== undefined && value !== null) return String(value);
  }

  return undefined;
}

// This is based on code I saw in Tailwinds own plugin repositories like @tailwindcss/typography
// Types are a bit cursed right now
/**
 * @import {PluginCreator, PluginsConfig} from "tailwindcss/plugin"
 */
/** @type {PluginsConfig} */
const materialTailwindPlugin = plugin.withOptions(
  () => {
    return (_api) => {};
  },
  (options) => {
    let sourceColor;
    if (options === undefined) throw new PluginOptionsUndefinedError();
    if ("source-color" in options) {
      sourceColor = options["source-color"];
    } else if ("sourceColor" in options) {
      sourceColor = options.sourceColor;
    } else if ("source" in options) {
      sourceColor = options.source;
    } else {
      throw new PluginOptionsUndefinedError();
    }

    /** @type {VariantName} */
    let variantName = defaultVariant;
    const variant = readOption(options, ["variant", "style"]);
    if (variant !== undefined) {
      // Accept "tonalSpot" as well as "tonal-spot"
      const name = camelToKebabCase(variant.trim()).toLowerCase();
      if (!(name in variants)) throw new UnknownVariantError(variant);

      variantName = /** @type {VariantName} */ (name);
    }

    const specVersion =
      readOption(options, ["spec-version", "specVersion", "spec"]) ??
      defaultSpecVersion;
    if (!specVersions.includes(specVersion))
      throw new UnknownSpecVersionError(specVersion);

    /** @type {Gamut} */
    let gamut = defaultGamut;
    const requestedGamut = readOption(options, [
      "gamut",
      "color-gamut",
      "colorGamut",
    ]);
    if (requestedGamut !== undefined) {
      const alias = gamutAliases.get(requestedGamut.trim().toLowerCase());
      if (alias === undefined) throw new UnknownGamutError(requestedGamut);

      gamut = alias;
    }

    const tailwindTheme = createTheme(
      sourceColor,
      variantName,
      /** @type {SpecVersion} */ (specVersion),
      gamut,
    );
    return { theme: tailwindTheme };
  },
);

export default materialTailwindPlugin;

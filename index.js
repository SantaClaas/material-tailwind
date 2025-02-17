import {
  argbFromHex,
  hexFromArgb,
  TonalPalette,
  SchemeTonalSpot,
  Hct,
  MaterialDynamicColors,
  DynamicColor,
} from "@material/material-color-utilities";
import plugin from "tailwindcss/plugin.js";

import defaultConfiguration from "./default.config.js";

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
 * @returns {Generator<[number, string]>}
 */
function* generatePaletteSteps(palette) {
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
    yield [step, hexFromArgb(palette.tone(step))];
  }
}

/** @typedef {[name: string, palette: TonalPalette][]} PaletteArray */
/**
 *
 * @param {PaletteArray} materialPalettes
 */
function createPalettes(materialPalettes) {
  /** @type {Record<string, string>} */
  const palettes = {};
  for (let [name, palette] of materialPalettes) {
    name = camelToKebabCase(name);

    for (const [step, color] of generatePaletteSteps(palette)) {
      palettes[`${name}-${step}`] = color;
    }
  }

  return palettes;
}

/**
 *
 * @param {Schemes} schemes
 * @returns {Record<string, string | Record<string, string>>}
 */
function createColors(schemes) {
  /** @type {Record<string, string | Record<string, string> >} */
  const colors = {};

  for (let [name, scheme] of Object.entries(schemes)) {
    /** @type {Record<string,string>} */
    const schemeColors = {};

    for (const [name, color] of Object.entries(MaterialDynamicColors)) {
      // Only properties with color values
      if (!(color instanceof DynamicColor)) continue;

      const value = scheme.getArgb(color);
      const key = camelToKebabCase(name);
      schemeColors[key] = hexFromArgb(value);
    }

    name = camelToKebabCase(name);
    colors[name] = schemeColors;
  }

  for (let [name, color] of Object.entries(MaterialDynamicColors)) {
    // Only properties with color values
    if (!(color instanceof DynamicColor)) continue;
    let lightValue = schemes.light.getArgb(color);
    let darkValue = schemes.dark.getArgb(color);
    let lightHex = hexFromArgb(lightValue);
    let darkHex = hexFromArgb(darkValue);
    name = camelToKebabCase(name);

    colors[name] = `light-dark(${lightHex}, ${darkHex})`;

    // Reduced contrast
    lightValue = schemes["light-reduced-contrast"].getArgb(color);
    darkValue = schemes["dark-reduced-contrast"].getArgb(color);
    lightHex = hexFromArgb(lightValue);
    darkHex = hexFromArgb(darkValue);
    name = camelToKebabCase(name);
    colors[`reduced-contrast-${name}`] = `light-dark(${lightHex}, ${darkHex})`;

    // Medium contrast
    lightValue = schemes["light-medium-contrast"].getArgb(color);
    darkValue = schemes["dark-medium-contrast"].getArgb(color);
    lightHex = hexFromArgb(lightValue);
    darkHex = hexFromArgb(darkValue);
    name = camelToKebabCase(name);
    colors[`medium-contrast-${name}`] = `light-dark(${lightHex}, ${darkHex})`;

    // High contrast
    lightValue = schemes["light-high-contrast"].getArgb(color);
    darkValue = schemes["dark-high-contrast"].getArgb(color);
    lightHex = hexFromArgb(lightValue);
    darkHex = hexFromArgb(darkValue);
    name = camelToKebabCase(name);
    colors[`high-contrast-${name}`] = `light-dark(${lightHex}, ${darkHex})`;
  }

  return colors;
}

/**
 * @typedef {"light" | "dark"} Scheme
 * @typedef {"reduced" | "medium" | "high"} Contrast
 * @typedef {Scheme | `${Scheme}-${Contrast}-contrast`} SchemeName
 * @typedef {Record<SchemeName, SchemeTonalSpot>} Schemes
 */

/**
 * Using contrast values as recommended by https://github.com/material-foundation/material-color-utilities/blob/9889de141b3b5194b8574f9e378e55f4428bdb5e/dev_guide/creating_color_scheme.md
 *
 * @param {string} sourceColor
 * @returns {Schemes}
 */
function createSchemes(sourceColor) {
  const color = Hct.fromInt(argbFromHex(sourceColor));

  return {
    "light-reduced-contrast": new SchemeTonalSpot(color, false, -1),
    light: new SchemeTonalSpot(color, false, 0),
    "light-medium-contrast": new SchemeTonalSpot(color, false, 0.5),
    "light-high-contrast": new SchemeTonalSpot(color, false, 1),
    "dark-reduced-contrast": new SchemeTonalSpot(color, true, -1),
    dark: new SchemeTonalSpot(color, true, 0),
    "dark-medium-contrast": new SchemeTonalSpot(color, true, 0.5),
    "dark-high-contrast": new SchemeTonalSpot(color, true, 1),
  };
}

/** @param {string} sourceColor */
function createTheme(sourceColor) {
  const schemes = createSchemes(sourceColor);
  const colors = createColors(schemes);

  // The palettes are the same for light and dark
  /** @type {PaletteArray} */
  const sourcePalettes = Object.entries(schemes.light)
    .filter(([, value]) => value instanceof TonalPalette)
    // Remove "palette" postfix
    .map(([key, value]) => [key.replace("Palette", ""), value]);

  const palettes = createPalettes(sourcePalettes);

  const tailwindTheme = defaultConfiguration;

  // Set colors
  tailwindTheme.extend = {
    ...tailwindTheme.extend,
    colors: {
      source: sourceColor,
      ...colors,
      ...palettes,
    },
  };

  return tailwindTheme;
}

class SourceColorUndefinedError extends Error {}

//TODO fix types when Tailwind CSS version > 4.0.6 is released
// This is based on code I saw in Tailwinds own plugin repositories like @tailwindcss/typography
export default plugin.withOptions(
  () => {
    return (api) => {
      api.addBase();
    };
  },
  (options) => {
    const sourceColor =
      // Name when used in new Tailwind CSS v4 CSS file configuration
      options["source-color"] ??
      // Name when used in JS Tailwind CSS configuration
      options.sourceColor ??
      // Formatters don't support camelCase in CSS and screw this up so we are forgiving
      options["sourcecolor"] ??
      // Legacy option name
      options.source;

    if (sourceColor === undefined)
      throw new SourceColorUndefinedError(
        "Please configure a source color in your Tailwind CSS file to use @claas.dev/material-tailwind e.g. `@plugin '@claas.dev/material-tailwind' { sourceColor: '#0c1445' }`"
      );

    const tailwindTheme = createTheme(sourceColor);
    return { theme: tailwindTheme };
  }
);

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
 */
function generatePaletteSteps(palette) {
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

  /** @type {Record<string, string>} */
  const result = {};
  for (const step of materialPalletteSteps) {
    result[step] = hexFromArgb(palette.tone(step));
  }

  return result;
}

/** @typedef {[name: string, palette: TonalPalette][]} PaletteArray */
/**
 *
 * @param {PaletteArray} materialPalettes
 */
function createPalettes(materialPalettes) {
  /** @type {Record<string, Record<string, string>>} */
  const palettes = {};
  for (let [name, palette] of materialPalettes) {
    const paletteSteps = generatePaletteSteps(palette);
    name = camelToKebabCase(name);
    palettes[name] = paletteSteps;
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
    const lightValue = schemes.light.getArgb(color);
    const darkValue = schemes.dark.getArgb(color);
    const lightHex = hexFromArgb(lightValue);
    const darkHex = hexFromArgb(darkValue);
    name = camelToKebabCase(name);

    colors[name] = `light-dark(${lightHex}, ${darkHex})`;
  }

  return colors;
}

/** @typedef {"light-reduced-contrast" | "light" | "light-medium-contrast" | "light-high-contrast" | "dark-reduced-contrast" | "dark" | "dark-medium-contrast" | "dark-high-contrast"} ContrastLevel */
/** @typedef {Record<ContrastLevel, SchemeTonalSpot>} Schemes */

/**
 * Using contrast values as recommended https://github.com/material-foundation/material-color-utilities/blob/9889de141b3b5194b8574f9e378e55f4428bdb5e/dev_guide/creating_color_scheme.md
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

/**
 * @typedef {Object} Configuration
 * @property {string} source - The source color as hex string to generate the theme colors from
 */

/**
 * Creates the plugin based on the configuration
 * @param {Configuration} configuration
 * @returns {ReturnType<typeof plugin>}
 */
export default function materialTailwind(configuration) {
  const tailwindTheme = createTheme(configuration.source);

  //TODO use plugin.withOptions
  /** @type {Parameters<typeof plugin>[0]} */
  const creator = function (api) {
    api.matchVariant;
  };
  return plugin(creator, { theme: tailwindTheme });
}

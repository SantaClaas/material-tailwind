import {
  argbFromHex,
  hexFromArgb,
  TonalPalette,
  DynamicScheme,
  SchemeTonalSpot,
  Hct,
  MaterialDynamicColors,
  DynamicColor,
  // Using the repository as dependency as it includes color utilities not yet released
} from "@material/material-color-utilities";
import plugin from "tailwindcss/plugin.js";

import defaultConfiguration from "./default.config.js";

//TODO check back if Tailwind CSS exports types after 4.0.6
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
 * @param {{[key: string]: DynamicScheme}} schemes
 * @returns {Record<string, Record<string, string>>}
 */
function createColors(schemes) {
  /** @type {Record<string, Record<string, string>>} */
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

  return colors;
}

/** @param {string} sourceColor */
function createTheme(sourceColor) {
  // Use new DynamicScheme as in
  // https://github.com/material-foundation/material-color-utilities/blob/main/make_schemes.md
  const color = Hct.fromInt(argbFromHex(sourceColor));
  const light = new SchemeTonalSpot(color, false, 0);
  const dark = new SchemeTonalSpot(color, true, 0);

  const colors = createColors({ light, dark });

  // The palettes are the same for light and dark
  /** @type {PaletteArray} */
  const sourcePalettes = Object.entries(light)
    .filter(([, value]) => value instanceof TonalPalette)
    // Remove "palette" postfix
    .map(([key, value]) => [key.replace("Palette", ""), value]);

  const palettes = createPalettes(sourcePalettes);
  //TODO find out what tone high and medium contrast have
  // console.debug("materialTheme", materialTheme);
  // let source = Hct.fromInt(0x673ab7);
  // const lightPrimary = Hct.fromInt(0x68548e);
  // const lightMediumPrimary = Hct.fromInt(0x4b3970);
  // const lightHighPrimary = Hct.fromInt(0x2a164d);
  // const lightSecondary = Hct.fromInt(0x635b70);
  // const lightMediumSecondary = Hct.fromInt(0x473f54);
  // const lightHighSecondary = Hct.fromInt(0x251f32);
  // console.log("hct", {
  //   source,
  //   lightPrimary,
  //   lightMediumPrimary,
  //   lightHighPrimary,
  //   lightSecondary,
  //   lightMediumSecondary,
  //   lightHighSecondary,
  // });

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

  /** @type {Parameters<typeof plugin>[0]} */
  const creator = function (_api) {};
  return plugin(creator, { theme: tailwindTheme });
}

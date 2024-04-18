import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  TonalPalette,
} from "@material/material-color-utilities/index.js";
import plugin from "tailwindcss/plugin.js";

import defaultConfiguration from "./default.config.js";

/**
 * @typedef {import("@material/material-color-utilities").Theme} Theme
 * @typedef {import("tailwindcss").Config} Config
 * @typedef {import("tailwindcss/types/config").CustomThemeConfig} CustomThemeConfig
 * @typedef {import("tailwindcss/types/config").OptionalConfig} OptionalConfig
 * @typedef {import("tailwindcss/types/config").PluginAPI} PluginAPI
 * @typedef {import("tailwindcss/types/config").RecursiveKeyValuePair<string,string>} RecursiveKeyValuePair
 * @typedef {import("@material/material-color-utilities").Scheme} Scheme
 */

/**
 * @template {*} T
 * @typedef {import("tailwindcss/types/config").ResolvableTo<T>} ResolvableTo<T>
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
 * @returns {RecursiveKeyValuePair}
 */
function generatePaletteSteps(palette) {
  // Supported color steps
  // Material Design goes from 0 to 100 for lightness (like percent)
  // whereas Tailwind goes from 50 to 950
  // We support material way of thinking here

  // Create Tonal palletes
  // See https://m3.material.io/styles/color/system/how-the-system-works#3ce9da92-a118-4692-8b2c-c5c52a413fa6
  // And https://material-foundation.github.io/material-theme-builder/
  //TODO check out tailwind dynamic color values and/or make configurable
  const materialPalletteSteps = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100,
  ];

  /**
   * @type {ResolvableTo<RecursiveKeyValuePair>}
   */
  const result = {};
  for (const step of materialPalletteSteps) {
    result[step] = hexFromArgb(palette.tone(step));
  }

  return result;
}

/**
 *
 * @param {{ [key: string]: TonalPalette }} materialPalettes
 * @returns {RecursiveKeyValuePair}
 */
function createPalletes(materialPalettes) {
  /** @type {Record<string, RecursiveKeyValuePair>} */
  const palettes = {};
  for (let key in materialPalettes) {
    const palette = materialPalettes[key];

    const paletteSteps = generatePaletteSteps(palette);
    key = camelToKebabCase(key);
    palettes[key] = paletteSteps;
  }

  return palettes;
}

/**
 *
 * @param {{[key: string]: Scheme}} schemes
 * @returns {RecursiveKeyValuePair}
 */
function createColors(schemes) {
  /** @type {RecursiveKeyValuePair} */
  const colors = {};

  for (let schemeKey in schemes) {
    const schemeValue = schemes[schemeKey];
    /** @type {{[key: string]: number}} */
    const schemeJson = schemeValue.toJSON();
    /** @type {Record<string,string>} */
    const schemeColors = {};
    for (let colorKey in schemeJson) {
      const colorValue = schemeJson[colorKey];

      colorKey = camelToKebabCase(colorKey);
      schemeColors[colorKey] = hexFromArgb(colorValue);
    }

    schemeKey = camelToKebabCase(schemeKey);
    colors[schemeKey] = schemeColors;
  }

  return colors;
}

/**
 *
 * @param {string} sourceColor
 * @returns {Partial<CustomThemeConfig>}
 */
function createTheme(sourceColor) {
  const materialTheme = themeFromSourceColor(argbFromHex(sourceColor));

  const colors = createColors(materialTheme.schemes);

  const palletes = createPalletes(materialTheme.palettes);
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

  /**
   * @type {Partial<CustomThemeConfig & { extend: Partial<CustomThemeConfig> }>}
   */
  const tailwindTheme = {
    ...defaultConfiguration,
    colors: {
      source: hexFromArgb(materialTheme.source),
      ...colors,
      ...palletes,
    },
  };

  return tailwindTheme;
}

/**
 * @typedef {Object} Configuration
 * @property {string} source - The source color as hex string to generate the theme colors from
 */

/**
 *
 * @param {Configuration} configuration
 * @returns
 */
export default function materialTailwind(configuration) {
  /**
   * @type {Partial<CustomThemeConfig>}
   */
  const tailwindTheme = createTheme(configuration.source);

  /** @type {import("tailwindcss/types/config").PluginCreator} */
  const creator = function (_api) {};
  return plugin(creator, { theme: tailwindTheme });
}

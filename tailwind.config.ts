import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  TonalPalette,
  Theme,
  Hct,
  DynamicScheme,
  DynamicColor,
} from "@material/material-color-utilities";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import {
  CustomThemeConfig,
  OptionalConfig,
  PluginAPI,
  PluginCreator,
  RecursiveKeyValuePair,
  ResolvableTo,
} from "tailwindcss/types/config";

import defaultConfiguration from "./default.config";

/**
 * Convert camelCase to kebab-case
 * e.g. "neutralVarialt" -> "neutral-variant"
 * @param value
 * @returns
 */
function camelToKebabCase(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generatePaletteSteps(
  palette: TonalPalette
): ResolvableTo<RecursiveKeyValuePair> {
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

  const result: ResolvableTo<RecursiveKeyValuePair> = {};
  for (const step of materialPalletteSteps) {
    result[step] = hexFromArgb(palette.tone(step));
  }

  return result;
}

function createPalletes(
  materialPalettes: Theme["palettes"]
): ResolvableTo<RecursiveKeyValuePair> {
  const palettes = {};
  for (let key in materialPalettes) {
    const palette = materialPalettes[key as keyof typeof materialPalettes];

    const paletteSteps = generatePaletteSteps(palette);
    key = camelToKebabCase(key);
    palettes[key] = paletteSteps;
  }

  return palettes;
}

function createColors(
  schemes: Theme["schemes"]
): ResolvableTo<RecursiveKeyValuePair> {
  const colors = {};

  for (let schemeKey in schemes) {
    const schemeValue = schemes[schemeKey as keyof typeof schemes];
    const schemeJson = schemeValue.toJSON();
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

function createTheme(sourceColor: string): Partial<CustomThemeConfig> {
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

  const tailwindTheme: Partial<
    CustomThemeConfig & { extend: Partial<CustomThemeConfig> }
  > = {
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
 * The tailwind theme can be generated either from a source color or from a theme file generated using material theme builder
 */
type ThemeSource =
  | {
      /**
       * The source color to generate the theme from using material color utilities
       */
      color: string;
    }
  | {
      /**
       * Path to the theme JSON file generated using material theme builder
       */
      themeFile: string;
    };
type PluginConfiguration = {
  /**
   * Whether to use tailwind naming conventions for valus (e.g. "radius-xs") or material naming conventions (e.g. "shape-corner-extra-small")
   * This does not affect color names as the name of the colors you choose isn't known.
   * Default: true
   * @see https://material.io/design/shape/about-shape.html#shape-customization
   */
  preferTailwindNaming: boolean;

  /**
   * The source of the theme colors
   */
  source: ThemeSource;

  /**
   * If set to true the values set by the plugin can be overwritten throught the Material Design CSS variables
   */
  useVariables: boolean;
};

function createPlugin(sourceColor: string) {
  const tailwindTheme: Partial<CustomThemeConfig> = createTheme(sourceColor);

  const creator: PluginCreator = function (api: PluginAPI): void {};
  return plugin(creator, { theme: tailwindTheme });
}

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [createPlugin("#0C1445")],
} satisfies Config;

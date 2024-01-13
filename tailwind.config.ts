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
    colors: {
      source: hexFromArgb(materialTheme.source),
      ...colors,
      ...palletes,
    },
    borderRadius: {
      none: "0px",
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.75rem",
      full: "100%",
    },
    boxShadow: {
      // I think these were based on Figma Material Design Kit
      none: "none",
      "elevation-light-level-1":
        "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
      "elevation-light-level-2":
        "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
      "elevation-light-level-3":
        "0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
      "elevation-light-level-4":
        "0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
      "elevation-light-level-5":
        " 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",

      "elevation-dark-level-1":
        "0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
      "elevation-dark-level-2":
        "0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
      "elevation-dark-level-3":
        "0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",
      "elevation-dark-level-4":
        "0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",
      "elevation-dark-level-5":
        "0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",
    },

    fontFamily: ({ theme }) => ({
      // ...theme("fontFamily"),
      sans: [
        "ui-sans-serif",
        "system-ui",
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: [
        "ui-serif",
        "Georgia",
        "Cambria",
        '"Times New Roman"',
        "Times",
        "serif",
      ],
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        '"Liberation Mono"',
        '"Courier New"',
        "monospace",
      ],
      //TODO replace these placeholder fonts
      display: ["Roboto", "sans-serif"],
      headline: ["Roboto", "sans-serif"],
      body: ["Roboto", "sans-serif"],
      label: ["Roboto", "sans-serif"],
      title: ["Roboto", "sans-serif"],
    }),

    fontSize: {
      "display-lg": [
        "3.5625rem",
        { fontWeight: "400", letterSpacing: "-0.25px", lineHeight: "4rem" },
      ],
      "display-md": [
        "2.8125rem",
        { fontWeight: "400", letterSpacing: "0px", lineHeight: "3.25rem" },
      ],
      "display-sm": [
        "2.25rem",
        { fontWeight: "400", letterSpacing: "0px", lineHeight: "2.75rem" },
      ],

      "headline-lg": [
        "2rem",
        { fontWeight: "400", letterSpacing: "0px", lineHeight: "2.5rem" },
      ],
      "headline-md": [
        "1.75rem",
        { fontWeight: "400", letterSpacing: "0px", lineHeight: "2.25rem" },
      ],
      "headline-sm": [
        "1.5rem",
        { fontWeight: "400", letterSpacing: "0px", lineHeight: "2rem" },
      ],

      "body-lg": [
        "1rem",
        { fontWeight: "400", letterSpacing: "0.5px", lineHeight: "1.5rem" },
      ],
      "body-md": [
        "0.875rem",
        { fontWeight: "400", letterSpacing: "0.25px", lineHeight: "1.25rem" },
      ],
      "body-sm": [
        "0.75rem",
        { fontWeight: "400", letterSpacing: "0.4px", lineHeight: "1rem" },
      ],

      "label-lg": [
        "0.875rem",
        { fontWeight: "500", letterSpacing: "0.10px", lineHeight: "1.25rem" },
      ],
      "label-md": [
        "0.75rem",
        { fontWeight: "500", letterSpacing: "0.5px", lineHeight: "1rem" },
      ],
      "label-sm": [
        "0.675rem",
        { fontWeight: "500", letterSpacing: "0.5px", lineHeight: "1rem" },
      ],

      "title-lg": [
        "1.375rem",
        { fontWeight: "400", letterSpacing: "0px", lineHeight: "1.75rem" },
      ],
      "title-md": [
        "1rem",
        { fontWeight: "500", letterSpacing: "0.15px", lineHeight: "1.5rem" },
      ],
      "title-sm": [
        "0.875rem",
        { fontWeight: "500", letterSpacing: "0.10px", lineHeight: "1.25rem" },
      ],
    },

    fontWeight: {
      "display-lg": "400",
      "display-md": "400",
      "display-sm": "400",

      "headline-lg": "400",
      "headline-md": "400",
      "headline-sm": "400",

      "body-lg": "400",
      "body-md": "400",
      "body-sm": "400",

      "label-lg": "500",
      "label-md": "500",
      "label-sm": "500",

      "title-lg": "400",
      "title-md": "500",
      "title-sm": "500",
    },

    letterSpacing: {
      "display-lg": "-0.25px",
      "display-md": "0px",
      "display-sm": "0px",

      "headline-lg": "0px",
      "headline-md": "0px",
      "headline-sm": "0px",

      "body-lg": "0.5px",
      "body-md": "0.25px",
      "body-sm": "0.4px",

      "label-lg": "0.10px",
      "label-md": "0.5px",
      "label-sm": "0.5px",

      "title-lg": "0px",
      "title-md": "0.15px",
      "title-sm": "0.10px",
    },

    lineHeight: {
      "display-lg": "4rem",
      "display-md": "3.25rem",
      "display-sm": "2.75rem",

      "headline-lg": "2.5rem",
      "headline-md": "2.25rem",
      "headline-sm": "2rem",

      "body-lg": "1.5rem",
      "body-md": "1.25rem",
      "body-sm": "1rem",

      "label-lg": "1.25rem",
      "label-md": "1rem",
      "label-sm": "1rem",

      "title-lg": "1.75rem",
      "title-md": "1.5rem",
      "title-sm": "1.25rem",
    },
    /* https://m3.material.io/styles/motion/easing-and-duration/tokens-specs */
    transitionDuration: {
      none: "0ms",
      "short-1": "50ms",
      "short-2": "100ms",
      "short-3": "150ms",
      "short-4": "200ms",
      "medium-1": "250ms",
      "medium-2": "300ms",
      "medium-3": "350ms",
      "medium-4": "400ms",
      "long-1": "450ms",
      "long-2": "500ms",
      "long-3": "550ms",
      "long-4": "600ms",
      "extra-long-1": "700ms",
      "extra-long-2": "800ms",
      "extra-long-3": "900ms",
      "extra-long-4": "1s",
    },

    /* https://m3.material.io/styles/elevation/tokens */
    zIndex: {
      "elevation-level-0": "0",
      "elevation-level-1": "1",
      "elevation-level-2": "3",
      "elevation-level-3": "6",
      "elevation-level-4": "8",
      "elevation-level-5": "12",
    },

    extend: {
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        accelerate: "cubic-bezier(0.3, 0, 1, 1)",
        decelerate: "cubic-bezier(0, 0, 0, 1)",
        linear: "linear",
        emphasized: `linear(
          0,
          0.002,
          0.01 3.6%,
          0.034,
          0.074 9.1%,
          0.128 11.4%,
          0.194 13.4%,
          0.271 15%,
          0.344 16.1%,
          0.544,
          0.66 20.6%,
          0.717 22.4%,
          0.765 24.6%,
          0.808 27.3%,
          0.845 30.4%,
          0.883 35.1%,
          0.916 40.6%,
          0.942 47.2%,
          0.963 55%,
          0.979 64%,
          0.991 74.4%,
          0.998 86.4%,
          1
        )`,
        "emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
        "emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
      },
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

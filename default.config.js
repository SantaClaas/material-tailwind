/**
 * @import plugin from "tailwindcss/plugin.js"
 * @type {Required<Required<Parameters<typeof plugin>>[1]>["theme"]} */
export default {
  extend: {
    borderRadius: {
      "extra-small": "0.25rem",
      small: "0.5rem",
      medium: "0.75rem",
      large: "1rem",
      "extra-large": "1.75rem",
    },
    boxShadow: {
      // I think these were based on Figma Material Design Kit
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

    fontSize: {
      "display-lg": ["3.5625rem", { fontWeight: "400", lineHeight: "4rem" }],
      "display-md": ["2.8125rem", { fontWeight: "400", lineHeight: "3.25rem" }],
      "display-sm": ["2.25rem", { fontWeight: "400", lineHeight: "2.75rem" }],

      "headline-lg": ["2rem", { fontWeight: "400", lineHeight: "2.5rem" }],
      "headline-md": ["1.75rem", { fontWeight: "400", lineHeight: "2.25rem" }],
      "headline-sm": ["1.5rem", { fontWeight: "400", lineHeight: "2rem" }],

      "body-lg": ["1rem", { fontWeight: "400", lineHeight: "1.5rem" }],
      "body-md": ["0.875rem", { fontWeight: "400", lineHeight: "1.25rem" }],
      "body-sm": ["0.75rem", { fontWeight: "400", lineHeight: "1rem" }],

      "label-lg": ["0.875rem", { fontWeight: "500", lineHeight: "1.25rem" }],
      "label-md": ["0.75rem", { fontWeight: "500", lineHeight: "1rem" }],
      "label-sm": ["0.675rem", { fontWeight: "500", lineHeight: "1rem" }],

      "title-lg": ["1.375rem", { fontWeight: "400", lineHeight: "1.75rem" }],
      "title-md": ["1rem", { fontWeight: "500", lineHeight: "1.5rem" }],
      "title-sm": ["0.875rem", { fontWeight: "500", lineHeight: "1.25rem" }],
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

// export default defaultConfiguration;

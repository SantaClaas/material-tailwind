# Material Theme Plugin for Tailwind CSS

Use the Material design system with Tailwind CSS.

- Swap Tailwind CSS default design system for Material where possible
- The [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) extension automatically picks up the new tokens for you to use

Primarily this allows you to use [Material color roles](https://m3.material.io/styles/color/roles) in Tailwind CSS.

# Get started

### Install

```
npm install --save-dev @claas.dev/material-tailwind
```

### Configure plugin

In your Tailwind CSS configuration e.g. `tailwind.config.js`

```js
import materialTailwind from "@claas.dev/material-tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  // Choose your source color to construct your theme from
  plugins: [materialTailwind({ source: "#0c1445" })],
};
```

For reference you can look at an [example](https://github.com/SantaClaas/material-tailwind/tree/main/example) using SolidJS.

# How it works

This package provides a Tailwind CSS plugin that wraps [material-color-utilites](https://www.npmjs.com/package/@material/material-color-utilities) for colors and provides other material theme tokens collected from various sources like [material.io](https://material.io) and the [Figma Material 3 Design Kit (Community)](https://www.figma.com/community/file/1035203688168086460).

# Roadmap

- Support high and medium contrast as seen in theme.json output from Material theme builder
- Add more configuration options
  - Make overwrite optional

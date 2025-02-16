# Material Theme Plugin for Tailwind CSS

Use the Material design system with Tailwind CSS. Based on [material.io](https://m3.material.io/).

# Get started

### Install

```
npm install --save-dev @claas.dev/material-tailwind
```

### Configure plugin

#### Tailwind CSS v4.0

```css
/* This is from your Tailwind CSS install */
@import "tailwindcss";

@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
}
```

For reference you can look at an [example](https://github.com/SantaClaas/material-tailwind/tree/main/example) using SolidJS.

#### Tailwind CSS v3.0 (or v4.0 with configuration file)

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
  plugins: [materialTailwind({ sourceColor: "#0c1445" })],
};
```

# How it works

The plugin generates colors with [@material/material-color-utilites](https://www.npmjs.com/package/@material/material-color-utilities) and extends the Tailwind CSS theme to make them available for you. Additionally this plugin extends the default theme with various design tokens collected from [material.io](https://material.io) and the [Material 3 Design Kit (Community)](https://www.figma.com/community/file/1035203688168086460).

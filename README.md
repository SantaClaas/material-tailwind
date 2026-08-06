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
  /* Pick your favorite color */
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

### Options

| Option         | Values                                                                                             | Default      |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------ |
| `source-color` | Any hex color                                                                                       | _(required)_ |
| `variant`      | `monochrome`, `neutral`, `tonal-spot`, `vibrant`, `expressive`, `fidelity`, `content`, `rainbow`, `fruit-salad` | `tonal-spot` |
| `spec-version` | `2021`, `2025`                                                                                      | `2021`       |

Every option also accepts camelCase (`sourceColor`, `specVersion`) so the same names
work in a `tailwind.config.js`.

```css
@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
  variant: vibrant;
  spec-version: 2025;
}
```

#### `variant`

The scheme style used to derive the palettes from your source color. These are the same
styles offered by the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/),
so you can preview them there before picking one. `tonal-spot` is the default Material You
style.

#### `spec-version`

Which version of the Material color spec to generate. `2021` is the established spec and
stays the default. `2025` is the Material 3 Expressive spec, which shifts many tones
slightly and adds the `-dim` colors:

```html
<div class="bg-primary-dim text-on-primary">…</div>
```

The `-dim` utilities are generated under both spec versions, so you can use them without
opting in to `2025`.

# How it works

The plugin generates colors with [@material/material-color-utilites](https://www.npmjs.com/package/@material/material-color-utilities) and extends the Tailwind CSS theme to make them available for you. Additionally this plugin extends the default theme with various design tokens collected from [material.io](https://material.io) and the [Material 3 Design Kit (Community)](https://www.figma.com/community/file/1035203688168086460).

# Known issues

### `ERR_MODULE_NOT_FOUND` from `@material/material-color-utilities`

`@material/material-color-utilities@0.4.0` is an ESM-only package, but some of its
internal imports are missing the required `.js` extension. Node's ESM loader cannot
resolve those, so importing this plugin can fail with:

```
Cannot find module '.../@material/material-color-utilities/dynamiccolor/dynamic_scheme'
imported from .../@material/material-color-utilities/scheme/scheme_content.js
```

This is an upstream bug, tracked in
[material-foundation/material-color-utilities#195](https://github.com/material-foundation/material-color-utilities/issues/195).
The fix is [PR #193](https://github.com/material-foundation/material-color-utilities/pull/193),
which has not been released yet.

**Most setups are unaffected.** Tailwind CSS loads plugins through
[jiti](https://github.com/unjs/jiti), which resolves extensionless imports fine, so both
configuration methods above work as documented. You are only likely to hit this if you
import the plugin directly under Node's native ESM loader — for example from a test
runner that does not bundle dependencies.

If you do hit it, patch the dependency in your own project. With pnpm:

```bash
pnpm patch @material/material-color-utilities@0.4.0
```

Add the missing `.js` extensions in the printed directory, then run the `pnpm patch-commit`
command it gives you. npm and yarn users can do the equivalent with
[patch-package](https://www.npmjs.com/package/patch-package). Remove the patch once a fixed
release is out.

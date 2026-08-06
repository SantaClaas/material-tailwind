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

The [live example](https://santaclaas.github.io/material-tailwind/) shows every generated
color role. Its [source](https://github.com/SantaClaas/material-tailwind/tree/main/example)
uses SolidJS and is a reference for setting the plugin up.

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

| Option         | Values                                                                                                          | Default      |
| -------------- | --------------------------------------------------------------------------------------------------------------- | ------------ |
| `source-color` | Any hex color                                                                                                   | _(required)_ |
| `variant`      | `monochrome`, `neutral`, `tonal-spot`, `vibrant`, `expressive`, `fidelity`, `content`, `rainbow`, `fruit-salad` | `tonal-spot` |
| `spec-version` | `2021`, `2025`                                                                                                  | `2021`       |
| `gamut`        | `srgb`, `display-p3` (or `p3`), `rec2020`                                                                       | `srgb`       |

Every option also accepts camelCase (`sourceColor`, `specVersion`) so the same names
work in a `tailwind.config.js`.

```css
@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
  variant: vibrant;
  spec-version: 2025;
  gamut: display-p3;
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

#### `gamut`

Which gamut colors are fitted into. `srgb` is the default and emits hex, exactly matching
the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/).

`display-p3` and `rec2020` fit the same colors into a wider gamut instead and emit
`oklch()`, so saturated colors keep chroma that sRGB cannot hold:

```css
@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
  variant: vibrant;
  gamut: display-p3;
}
```

```
srgb        --color-primary: light-dark(#1c41ff, #bbc3ff);
display-p3  --color-primary: light-dark(oklch(0.50916 0.29357 264.68), …);
```

How much this gains depends on how much chroma your scheme asks for. `tonal-spot` and
`neutral` stay close to sRGB and change little. `vibrant`, `expressive`, `content` and
`fidelity` with a saturated source color are where sRGB was clipping most, and where a P3
display has the most to show.

Some things worth knowing before turning it on:

- **Tone is preserved exactly.** Material expresses its contrast guarantees in tone, and
  fitting to a wider gamut only ever spends chroma, never tone. Contrast between a color
  and its `on-` pair is unchanged.
- **sRGB displays are unaffected in principle.** Browsers gamut-map `oklch()` to the
  display, so these colors still render — but on an sRGB screen the browser does the
  fitting rather than Material, so the result is very close to, but not byte-identical
  to, the `srgb` output.
- **Out-of-sRGB colors are not hex.** If anything downstream parses your theme expecting
  `#rrggbb`, keep the default.

Browser support is not a concern: `oklch()` has been Baseline since 2023, which is older
than the `light-dark()` these colors are already emitted with.

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

### `on-*-fixed` can come out pure black under `spec-version: 2025`

Under the 2021 spec the fixed roles are fixed tones: `primary-fixed` is tone 90 and
`on-primary-fixed` is tone 10. The 2025 spec derives them from a contrast target of about
8:1 instead, and its `primary-fixed` is a good deal darker. With a high chroma variant
there is then no room left below, so the color bottoms out at tone 0:

| spec | `primary-fixed`     | `on-primary-fixed`  | contrast |
| ---- | ------------------- | ------------------- | -------- |
| 2021 | `#dfe0ff` (tone 90) | `#000e5f` (tone 10) | 13.2     |
| 2025 | `#8a99ff` (tone 66) | `#000000` (tone 0)  | 8.1      |

The contrast target is still met, so this is what the spec produces rather than a bug in
this plugin, which passes the values through unchanged. It is not specific to one source
color either: with `variant: vibrant` most source colors land on `#000000`, including
Material's own `#6750a4`. The sibling roles usually keep a tint because their palettes have
less chroma and their `-fixed` colors land lighter. Use `spec-version: 2021` if you want the
tinted pairing back.

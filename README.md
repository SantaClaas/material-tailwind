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
| `colors`       | `extend`, `replace`                                                                                             | `extend`     |
| `contrasts`    | any of `default`, `reduced`, `medium`, `high`, or `all`                                                         | `default`    |

Every option also accepts camelCase (`sourceColor`, `specVersion`) so the same names
work in a `tailwind.config.js`.

```css
@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
  variant: vibrant;
  spec-version: 2025;
  gamut: display-p3;
  colors: replace;
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

#### `colors`

Whether the generated colors are added to Tailwind's palette or take its place.

Material names its palettes for their role, and two of those names — `neutral` and
`error` — are also Tailwind color names. Material's steps go `0, 5, 10, … 95, 98, 99, 100`
and Tailwind's go `50, 100, 200, … 950`, so under the default `extend` the two scales
interleave. Material wins the steps it defines and Tailwind keeps the rest:

```
bg-neutral-50    Material tone 50   a mid grey
bg-neutral-500   Tailwind's neutral-500
```

`replace` drops Tailwind's palette entirely, so every color name means exactly one thing:

```css
@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
  colors: replace;
}
```

This removes `bg-red-500`, `text-sky-300` and every other Tailwind color utility. The
color keywords are built into the utilities rather than read from the theme, so
`bg-transparent`, `bg-current` and `bg-inherit` are unaffected, and `black` and `white`
are kept explicitly because they do come from the palette and are too widely used to drop.

`extend` stays the default so upgrading does not move anyone's colors.

#### `contrasts`

Material defines every color role at four contrast levels. Only the default one is
generated unless you ask for more, because the other three are two thirds of everything
this plugin emits and most themes never use them:

```css
@plugin "@claas.dev/material-tailwind" {
  source-color: #0c1445;
  contrasts: high;
}
```

That adds `bg-high-contrast-primary`, `bg-light-high-contrast-primary` and the rest of the
high contrast roles. The list is not exclusive, and any separator that reads naturally
works — `high medium`, `high, medium`, or `all` for every level.

The `default` level is always generated whether or not you list it, because the
unqualified roles (`bg-primary`, `text-on-surface`) come from it.

# Overriding colors at runtime

Every color is emitted as a CSS variable in Tailwind's own `--color-*` namespace, so you
can change one at runtime without rebuilding:

```js
document.documentElement.style.setProperty("--color-light-primary", "#ff0000");
```

### How the variables are wired

There are two kinds of token. **Leaves** hold a literal color — every per-scheme role and
every palette step:

```css
--color-light-primary            #525a92
--color-dark-primary             #bbc3ff
--color-light-high-contrast-primary  #1f275c
--color-primary-40               #525a92
```

**Composites** are built out of leaves with `light-dark()`, and are what the unqualified
utilities use:

```css
.bg-primary {
  background-color: var(
    --color-primary,
    light-dark(var(--color-light-primary), var(--color-dark-primary))
  );
}
```

Composites reference the leaves rather than restating their literals, so overriding
`--color-light-primary` moves `--color-primary` and every utility built on it.

Composites are never declared anywhere — they exist only as the fallback above. That means
you can override either level, and from anywhere:

```css
/* Retint every default-contrast color that builds on it. */
:root {
  --color-light-primary: #ff0000;
}

/* Or replace one composite outright, light and dark together. */
@theme {
  --color-primary: #ff0000;
}
```

### The leaves are registered with `@property`

```css
@property --color-light-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: #525a92;
}
```

This buys two things. An override that is not a color falls back to the generated default
instead of poisoning every declaration that reads it — an unregistered custom property
would take the whole `background-color` down with it. And a registered property is
animatable, so a theme change can be transitioned:

```css
:root {
  transition: --color-light-primary 300ms, --color-dark-primary 300ms;
}
```

The transition has to be declared on the element where the value changes — usually
`:root` — not on the element being painted. Interpolation propagates through the
`light-dark()` composites to the utilities.

### Why composites are not registered

A registered `<color>` property resolves to a single color at the element it is declared
on and inherits as that color. A registered `light-dark()` is therefore frozen at the
root's `color-scheme` and stops following a `color-scheme: dark` subtree. Composites have
to stay unregistered so `light-dark()` resolves where it is used. This also rules out
folding them into an `initial-value`, which may not contain `var()` at all.

### Roles are not derived from palette steps

It is tempting to make `--color-light-primary` reference `--color-primary-40`, so that
overriding five palettes would retint everything. It does not hold up. A role is exactly a
palette tone often enough to look right and not often enough to be correct:

| | light | dark | light-high-contrast |
| --- | --- | --- | --- |
| `spec-version: 2021` | 53/59 | 45/59 | 35/59 |
| `spec-version: 2025` | 12/59 | 13/59 | 28/59 |

The 2025 chroma multipliers and the contrast levels break the correspondence. Roles and
palette steps are therefore independent leaves.

### What this does not do

Changing the **source color** at runtime is not possible this way. Deriving a scheme from
a source color needs Material's HCT solver, which is JavaScript. CSS variables let you
override individual roles and swap between schemes you generated ahead of time.

### The cost

Because a Tailwind plugin cannot register real theme variables, every leaf ships whether
or not a utility uses it — Tailwind's tree shaking does not apply to what a plugin writes.
That is 227 registrations, about 1.83 kB gzipped, at the default contrast. Adding all four
contrast levels raises it to 581 registrations and about 4.20 kB.

Composites cost nothing when unused, since they live in the utilities rather than in a
block of their own. In the [example app](example) the stylesheet went from 3.90 kB to
6.27 kB gzipped. See [docs/tailwind-plugin-api.md](docs/tailwind-plugin-api.md) for why
the fixed part cannot be tree-shaken away.

# How it works

The plugin generates colors with [@material/material-color-utilites](https://www.npmjs.com/package/@material/material-color-utilities) and extends the Tailwind CSS theme to make them available for you. Additionally this plugin extends the default theme with various design tokens collected from [material.io](https://material.io) and the [Material 3 Design Kit (Community)](https://www.figma.com/community/file/1035203688168086460).

# Known issues

### Tailwind CSS IntelliSense shows no color swatch

The colored square the VS Code extension draws next to a color utility does not appear for
the colors this plugin generates. `bg-red-500` still gets one, `bg-primary` does not.

The extension resolves a utility's value and then asks Tailwind's design system for any
theme variable in it. A plugin cannot register a real theme variable, so the design system
has never heard of `--color-primary`, the `var()` is left unresolved, and the value stops
being parseable as a color.

There is no way to fix this from inside a plugin. It is the same limitation that makes the
colors overridable in the first place, seen from the other side — see
[docs/tailwind-plugin-api.md](docs/tailwind-plugin-api.md).

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

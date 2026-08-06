# Where the Tailwind CSS plugin API constrains this plugin

Notes on the limits hit while making the generated colors overridable at runtime.
Everything here was verified against **Tailwind CSS 4.2.4** by compiling with the
`compile()` API and, where the question was about browser behaviour, by measuring in a
browser. Findings are dated to that version — the plugin API is not versioned separately.

The short version: a JS plugin cannot participate in Tailwind v4's theme system. It can
only hand Tailwind a v3-shaped config object and write base styles. Everything below
follows from that.

## 1. Plugin theme values are inlined, never emitted as variables

A plugin returning `{ theme: { extend: { colors: { primary: "#525a92" } } } }` produces:

```css
.bg-primary { background-color: #525a92; }
```

No `--color-primary` is emitted anywhere. Tailwind's JS-config compat layer registers
plugin theme values as *inline*, so they are substituted into utilities directly.

Contrast a color that came from CSS `@theme`, in the same stylesheet:

```css
.bg-red-500 { background-color: var(--color-red-500); }
```

Same namespace, same theme, different mechanism — purely because of where the value
entered. This is the root limitation; the rest are consequences of working around it.

**Worked around by** making every theme value a `var(--color-…)` reference and defining
the variables ourselves through `addBase`.

## 2. `@theme` is unreachable from a plugin

The obvious fix is for the plugin to emit an `@theme` block. It cannot. Passing one to
`addBase` copies it into the output verbatim, nested inside `@layer base`:

```css
@layer base {
  @theme static {
    --color-probe: #bbc3ff;
  }
}
```

Tailwind never parses it, no utilities are generated from it, and browsers ignore the
unknown at-rule. `@theme`, `@theme static`, `@theme inline` and `@theme default` all
behave this way. `@theme` is a CSS-level directive processed while parsing the stylesheet,
and plugins run after that.

This also means the modifiers Tailwind documents for exactly our situation are
unavailable: `static` (always emit) and `inline` (for variables that reference other
variables) are things we have to hand-roll.

## 3. No API to register a theme variable

The `PluginAPI` type in Tailwind 4.2.4 exposes:

```
addBase  addUtilities  addComponents  addVariant  matchUtilities
```

There is no `addTheme`, no `registerTheme`, nothing that reaches the theme system the way
CSS `@theme` does. `addBase` is the only place a plugin can put a declaration.

## 4. Consequence: no tree shaking

This is the expensive one.

Variables that enter through `@theme` are tree-shaken — only the ones actually used are
emitted. Variables written through `addBase` are ordinary base styles, so all of them
ship, every build, whether or not a single utility references them.

For this plugin that is 817 tokens. Measured on the example app:

| | raw | gzip |
| --- | --- | --- |
| before (inlined literals) | 17.34 kB | 3.90 kB |
| after (variables) | 131.59 kB | 11.62 kB |

About 1 kB gzip of the increase is the `@property` registrations. The rest is the lost
tree shaking. There is no way to recover it from inside a plugin: we cannot know which
utilities the user's content will produce, and even if we could, we have no hook that runs
late enough to prune.

The escape hatch is not a plugin at all — a codegen step that writes a `.css` file with a
real `@theme static { … }` block, which the user `@import`s. That gets genuine theme
registration, tree shaking, and `@theme inline`, at the cost of a build step and giving up
`@plugin` configuration. Worth revisiting if the size becomes a problem.

## 5. `addBase` output lands in `@layer base`, which loses to `@theme`

Tailwind's layer order is `theme, base, components, utilities`. Our variables are in
`base`; a user's `@theme` block lands in `theme`. Later layers win, so **our definitions
beat a user's `@theme` override** — the opposite of what someone would expect.

In practice this bites less than it sounds. Runtime overrides via
`element.style.setProperty()` or an unlayered `<style>` block both beat every layer, and
those are the actual use case. But a user trying to override a Material color from
`@theme` at build time will find it silently ignored, and has to use unlayered CSS
instead. That is a documentation burden created purely by the API limitation.

`@property` registrations are unaffected — registration is not a cascading declaration, so
being nested in a layer does not matter. That was verified rather than assumed.

## 6. Both plugin callbacks need the same work done

`plugin.withOptions` takes two functions: one returning the config, one receiving the
`PluginAPI`. Because the theme values and the variable definitions are two halves of the
same computation, both need the generated colors, and neither can hand anything to the
other. Solving a Material theme is not cheap — eight schemes, each fitted to a gamut — so
the result is memoised per distinct set of options.

Not a serious limitation, but the API shape does force the caching.

## 7. `theme.colors` replacement is all-or-nothing

Setting `theme.colors` rather than `theme.extend.colors` does work from a plugin and
cleanly replaces Tailwind's palette, which is how the `colors: replace` option is built.
But it is a whole-namespace switch — there is no way to say "drop Tailwind's `neutral`
scale but keep everything else", which is all that is actually needed to resolve the name
collision. Users who want the collision gone must drop `bg-red-500` and every other
Tailwind color with it.

Worth noting: `transparent`, `current` and `inherit` are built into the utilities and
survive replacement, but `black` and `white` come from `theme.colors` and disappear. The
plugin re-adds those explicitly.

## Browser-level constraints (not Tailwind's fault)

These shaped the design just as much and are recorded here so the reasoning is in one
place. All measured in a browser.

- **A registered `<color>` property freezes `light-dark()`.** It computes to a resolved
  color at the element it is declared on, so it stops following a `color-scheme: dark`
  subtree. Verified: a registered composite returned the same color in both a
  `color-scheme: light` and a `color-scheme: dark` subtree, while an unregistered one
  switched correctly. This is why composites are not registered.
- **`initial-value` may not contain `var()`.** It must be computationally independent; a
  rule that violates this is dropped entirely. This independently rules out registering
  the composites.
- **Registration makes invalid overrides safe.** An invalid value on a registered property
  falls back to `initial-value`; on an unregistered one it takes the whole declaration
  down (`rgba(0, 0, 0, 0)`).
- **Registered properties are animatable**, and interpolation propagates through an
  unregistered `light-dark()` composite to the utilities reading it. The `transition` must
  be declared where the value changes, not where it is painted.

## Open questions

- Is the codegen approach from §4 worth offering alongside the plugin? It removes §1, §2,
  §4 and §5 at once.
- Should there be an option to emit only a subset of tokens — say, the default contrast
  schemes and no palettes — to claw back some of §4 for users who never touch the rest?
- Does a later Tailwind version expose anything closer to theme registration for plugins?
  Worth re-checking §3 on upgrade; the whole design would change if it did.

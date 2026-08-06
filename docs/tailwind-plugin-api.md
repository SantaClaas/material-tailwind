# Where the Tailwind CSS plugin API constrains this plugin

Notes on the limits hit while making the generated colors overridable at runtime.
Everything here was verified against **Tailwind CSS 4.2.4** by compiling with the
`compile()` API, against **Tailwind CSS IntelliSense 0.16.0** by reading what the language
server actually does, and, where the question was about browser behaviour, by measuring in
a browser. Findings are dated to those versions — the plugin API is not versioned
separately.

The short version: a JS plugin cannot participate in Tailwind v4's theme system. It can
only hand Tailwind a v3-shaped config object and write base styles. Everything below
follows from that, including the editor tooling breaking, which looks like a separate
problem and is not.

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
emitted. Anything written through `addBase` is an ordinary base style, so all of it ships,
every build, whether or not a utility references it. We cannot know which utilities the
user's content will produce, and even if we could there is no hook that runs late enough
to prune.

Only what a plugin *writes* has this problem. Values that live inside the theme, and so
inside the utilities, are still tree-shaken by usage. That is what pushed the composites
into fallbacks (§5) and left only the leaf registrations as fixed cost.

Two things were done about the size:

- **Composites moved into the utilities.** 236 tokens that now cost nothing when unused.
- **Contrast levels became opt-in.** Material defines every role at four contrast levels,
  and the three non-default ones were 531 of 817 tokens — 68% of the output — which the
  example app did not use a single one of.

Measured on the example app:

| | raw | gzip |
| --- | --- | --- |
| before (inlined literals) | 17.34 kB | 3.90 kB |
| variables, all four contrasts, composites declared | 131.59 kB | 11.62 kB |
| variables, default contrast, composites as fallbacks | 43.38 kB | 6.27 kB |

The fixed part is now 227 registrations, about 1.83 kB gzip (581 and 4.20 kB with
`contrasts: all`).

The escape hatch for the rest is not a plugin at all — a codegen step that writes a `.css`
file with a real `@theme static { … }` block, which the user `@import`s. That gets genuine
theme registration, tree shaking, and `@theme inline`, at the cost of a build step and
giving up `@plugin` configuration. Worth revisiting if the size becomes a problem again.

## 5. `addBase` output lands in `@layer base`, which beats `@theme`

Tailwind's layer order is `theme, base, components, utilities`. Anything a plugin
*declares* lands in `base`; a user's `@theme` block lands in `theme`. Later layers win, so
a plugin declaration silently beats the user's own override — the opposite of what anyone
would expect.

This bit us. A first version declared the composites in a `:root` block and made
`@theme { --color-primary: … }` stop working, which it had done before the change.

The fix was to stop declaring anything. Composites are fallbacks inside the theme value
instead:

```css
.bg-primary {
  background-color: var(--color-primary, light-dark(var(--color-light-primary), …));
}
```

Nothing defines `--color-primary`, so setting it anywhere wins, `@theme` included. It also
costs nothing when no utility uses the color, which is as close to tree shaking as a
plugin gets.

`@property` registrations are unaffected either way — registration is not a cascading
declaration, so being nested in a layer does not matter. That was verified rather than
assumed.

The general lesson: **a plugin should read variables, not declare them.** Every value it
declares is a value the user cannot override from the place Tailwind documents.

## 6. Editor tooling stops showing color swatches

Tailwind CSS IntelliSense draws a colored square next to a color utility in the editor.
For every color this plugin generates, that square is now gone.

It is the same root cause as §1–§3 rather than a separate problem, and the mechanism is
worth writing down because it is not obvious. Checked against
`bradlc.vscode-tailwindcss@0.16.0`:

- The extension resolves a utility's value and then asks the **design system** for any
  theme variable in it — `designSystem.resolveThemeValue(name, true)`. That is why
  `bg-red-500`, which compiles to `var(--color-red-500)`, still gets a swatch: the design
  system knows that variable.
- Our variables are registered with `@property` in base styles. The design system has
  never heard of them, so `resolveThemeValue` returns nothing and the `var()` survives.
- Before parsing a color, the extension replaces any `var(…)` with the literal `1`. An
  unresolved variable therefore becomes an unparseable value, and no swatch is drawn.
- The regex it uses for that is `/var\([^)]+\)/`, which stops at the first `)`. Our
  composite fallback nests variables inside a `light-dark()`, so it is not merely
  unresolved but mangled.

The part that stings is that this is a **regression**, not a pre-existing gap. The
extension does understand `light-dark()` — it rewrites `light-dark(a, b)` to `a` and
swatches the light value. So before the colors became variables, every utility here had a
working swatch: the per-scheme roles were literal hex, and the composites were
`light-dark(#525a92, #bbc3ff)`. Both resolved. Trading that away was not a considered
decision at the time.

Nothing in the plugin API can fix it. The extension is asking the design system a
reasonable question; we simply cannot put anything into the design system (§3). The
codegen escape hatch in §4 would fix this too, and for the same reason it fixes the
others — a real `@theme` block is exactly what `resolveThemeValue` reads.

## 7. Both plugin callbacks need the same work done

`plugin.withOptions` takes two functions: one returning the config, one receiving the
`PluginAPI`. Because the theme values and the variable definitions are two halves of the
same computation, both need the generated colors, and neither can hand anything to the
other. Solving a Material theme is not cheap — eight schemes, each fitted to a gamut — so
the result is memoised per distinct set of options.

Not a serious limitation, but the API shape does force the caching.

## 8. `theme.colors` replacement is all-or-nothing

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
  §4, §5 and §6 at once, which is most of this document. The cost is a build step and
  giving up `@plugin` configuration.
- The palettes are 109 of the remaining 227 registrations and are arguably a lower-level
  tool than the roles. Should they be opt-in the way the contrast levels now are?
- Could the leaves become fallbacks too, the way the composites did, and drop the fixed
  cost to nothing? It would mean giving up `@property`, and with it the invalid-override
  fallback and animatable theme changes. That is the real trade: a few kB against those
  two properties.
- Does a later Tailwind version expose anything closer to theme registration for plugins?
  Worth re-checking §3 on upgrade; the whole design would change if it did.

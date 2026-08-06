import { expect, it } from "vitest";
import materialTailwind from ".";

/**
 * The theme values are `var()` references now, so the literal a color resolves
 * to lives in the variable the plugin defines through `addBase` rather than in
 * the theme. This collects both, and flattens the nested per-scheme colors the
 * way Tailwind does, so a test can ask for either side.
 * @param {Record<string, unknown>} options
 * @returns {{references: Record<string, any>, variables: Record<string, string>}}
 */
function createTheme(options) {
  const plugin = materialTailwind({ sourceColor: "#0c1445", ...options });

  /** @type {Record<string, string>} */
  const variables = {};
  plugin.handler(
    /** @type {any} */ ({
      /** @param {Record<string, any>} base */
      addBase(base) {
        for (const [selector, declarations] of Object.entries(base)) {
          // A registered leaf carries its color as the initial value, a
          // composite is a plain declaration in `:root`
          if (selector.startsWith("@property ")) {
            variables[selector.slice("@property ".length)] =
              declarations["initial-value"];
            continue;
          }

          Object.assign(variables, declarations);
        }
      },
    }),
  );

  const theme = plugin.config.theme;
  const colors = theme.colors ?? theme.extend.colors;

  return { references: colors, variables };
}

/**
 * The color a theme key ends up showing, following the `var()` reference and
 * any `light-dark()` composed out of further references.
 * @param {Record<string, unknown>} options
 * @returns {Record<string, any>}
 */
function createColors(options) {
  const { references, variables } = createTheme(options);

  /**
   * @param {string} value
   * @returns {string}
   */
  const resolve = (value) =>
    value.replace(
      /var\((--color-[a-z0-9-]+)\)/g,
      (_, name) => variables[name] ?? `UNDEFINED(${name})`,
    );

  /** @type {Record<string, any>} */
  const colors = {};
  for (const [name, value] of Object.entries(references)) {
    if (typeof value === "string") {
      colors[name] = resolve(resolve(value));
      continue;
    }

    /** @type {Record<string, string>} */
    const scheme = {};
    for (const [role, reference] of Object.entries(value))
      scheme[role] = resolve(/** @type {string} */ (reference));

    colors[name] = scheme;
  }

  return colors;
}

// This test is rather simple and more of a smoke test to ensure in CI that we build the dependency correctly
it("Can create a Material design TailwindCSS configuration", async () => {
  const plugin = materialTailwind({ sourceColor: "#0c1445" });
  const { variables } = createTheme({});

  // The theme only holds references now, so snapshotting it alone would stop
  // catching a color changing. The variables are where the colors went.
  const json = JSON.stringify(
    { theme: plugin.config.theme, variables },
    null,
    2,
  );
  await expect(json).toMatchFileSnapshot("./theme test.snapshot.json");
});

it("Points every theme color at a variable that is defined", () => {
  const { references, variables } = createTheme({});

  /** @type {string[]} */
  const values = [];
  for (const value of Object.values(references))
    if (typeof value === "string") values.push(value);
    else values.push(...Object.values(value));

  expect(values.length).toBeGreaterThan(0);
  for (const value of values) {
    expect(value).toMatch(/^var\(--color-[a-z0-9-]+\)$/);

    // Both the reference itself and anything it composes have to exist, or a
    // utility silently resolves to nothing
    for (const [, name] of value.matchAll(/var\((--color-[a-z0-9-]+)\)/g)) {
      expect(variables).toHaveProperty([name]);
      for (const [, nested] of String(variables[name]).matchAll(
        /var\((--color-[a-z0-9-]+)\)/g,
      ))
        expect(variables).toHaveProperty([nested]);
    }
  }
});

it("Composes the light-dark() colors out of the per-scheme variables", () => {
  const { variables } = createTheme({});

  // Restating the literals here would mean an override of the light color did
  // not move the color that uses it
  expect(variables["--color-primary"]).toBe(
    "light-dark(var(--color-light-primary), var(--color-dark-primary))",
  );
  expect(variables["--color-high-contrast-on-surface"]).toBe(
    "light-dark(var(--color-light-high-contrast-on-surface), var(--color-dark-high-contrast-on-surface))",
  );
});

it("Registers the literal colors, but never a light-dark() one", () => {
  const plugin = materialTailwind({ sourceColor: "#0c1445" });

  /** @type {Record<string, any>} */
  let base = {};
  plugin.handler(
    /** @type {any} */ ({
      addBase(/** @type {Record<string, any>} */ rules) {
        base = rules;
      },
    }),
  );

  let registered = 0;
  for (const [selector, declarations] of Object.entries(base)) {
    if (!selector.startsWith("@property ")) continue;

    registered++;
    expect(declarations.syntax).toBe('"<color>"');
    // Colors inherit, and an unregistered composite reading a registered leaf
    // depends on it
    expect(declarations.inherits).toBe("true");
    // A registered <color> resolves light-dark() against the root's
    // color-scheme and then stops following a dark subtree, so a composite must
    // not be registered. An initial-value may not hold a var() either.
    expect(declarations["initial-value"]).not.toMatch(/light-dark\(|var\(/);
  }

  expect(registered).toBeGreaterThan(500);
});

const variants = [
  "monochrome",
  "neutral",
  "tonal-spot",
  "vibrant",
  "expressive",
  "fidelity",
  "content",
  "rainbow",
  "fruit-salad",
];

it.each(variants)("Can create the %s variant", (variant) => {
  const colors = createColors({ variant });

  expect(colors.light.primary).toMatch(/^#[0-9a-f]{6}$/);
});

it("Defaults to the tonal spot variant", () => {
  expect(createColors({ variant: "tonal-spot" })).toStrictEqual(
    createColors({}),
  );
});

it("Accepts a variant in camelCase", () => {
  expect(createColors({ variant: "fruitSalad" })).toStrictEqual(
    createColors({ variant: "fruit-salad" }),
  );
});

it("Creates a different theme per variant", () => {
  // Monochrome, fidelity and content all resolve primary to black for this very
  // dark source color, so compare whole themes rather than a single color
  const themes = variants.map((variant) =>
    JSON.stringify(createColors({ variant })),
  );

  expect(new Set(themes).size).toBe(variants.length);
});

it("Defaults to the 2021 color spec", () => {
  expect(createColors({ "spec-version": "2021" })).toStrictEqual(
    createColors({}),
  );
  expect(createColors({ "spec-version": "2025" })).not.toStrictEqual(
    createColors({}),
  );
});

it("Accepts an unquoted spec version, as Tailwind parses it as a number", () => {
  expect(createColors({ "spec-version": 2025 })).toStrictEqual(
    createColors({ "spec-version": "2025" }),
  );
});

it("Creates the dim colors the 2025 spec adds", () => {
  const colors = createColors({ "spec-version": "2025" });

  for (const name of ["primary-dim", "secondary-dim", "tertiary-dim"]) {
    expect(colors.light[name]).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors[name]).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
  }
});

it("Rejects an unknown variant or spec version", () => {
  expect(() => createColors({ variant: "nope" })).toThrowError(
    /not a Material/,
  );
  expect(() => createColors({ "spec-version": "2030" })).toThrowError(
    /not a Material/,
  );
});

it("Extends Tailwind's colors by default, and replaces them when asked", () => {
  const extended = materialTailwind({ sourceColor: "#0c1445" }).config.theme;
  expect(extended.extend.colors).toBeDefined();
  // Leaving `colors` unset is what keeps Tailwind's own palette
  expect(extended.colors).toBeUndefined();

  const replaced = materialTailwind({
    sourceColor: "#0c1445",
    colors: "replace",
  }).config.theme;
  expect(replaced.colors).toBeDefined();
  expect(replaced.extend.colors).toBeUndefined();
  // The other parts of the theme still only extend
  expect(replaced.extend.borderRadius).toBeDefined();
});

it("Keeps black and white when replacing, as those come from the palette", () => {
  // `transparent`, `current` and `inherit` are built into the utilities and
  // survive on their own, but these two are read from the theme
  const { colors } = materialTailwind({
    sourceColor: "#0c1445",
    colors: "replace",
  }).config.theme;

  expect(colors.black).toBe("#000000");
  expect(colors.white).toBe("#ffffff");
});

it("Names the same colors whether extending or replacing", () => {
  const names = (/** @type {Record<string, unknown>} */ options) =>
    Object.keys(createColors(options)).sort();

  expect(names({ colors: "replace" }).filter((n) => n !== "black" && n !== "white")).toStrictEqual(
    names({}),
  );
});

it("Rejects an unknown way to apply the colors", () => {
  expect(() => createColors({ colors: "merge" })).toThrowError(
    /not a way to apply the colors/,
  );
});

/** Matches an `oklch()` value with a lightness, a chroma and a hue */
const oklch = /^oklch\(\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?\)$/;

it("Defaults to sRGB, in hex", () => {
  expect(createColors({ gamut: "srgb" })).toStrictEqual(createColors({}));
  expect(createColors({}).light.primary).toMatch(/^#[0-9a-f]{6}$/);
});

it.each(["display-p3", "rec2020"])("Creates %s colors in oklch", (gamut) => {
  const colors = createColors({ gamut });

  expect(colors.light.primary).toMatch(oklch);
  expect(colors["primary-40"]).toMatch(oklch);
  expect(colors.primary).toMatch(
    /^light-dark\(oklch\([^)]+\), oklch\([^)]+\)\)$/,
  );
});

it("Accepts p3 as an alias and is case insensitive", () => {
  expect(createColors({ gamut: "p3" })).toStrictEqual(
    createColors({ gamut: "display-p3" }),
  );
  expect(createColors({ gamut: "Display-P3" })).toStrictEqual(
    createColors({ gamut: "display-p3" }),
  );
  expect(createColors({ "color-gamut": "p3" })).toStrictEqual(
    createColors({ gamut: "display-p3" }),
  );
});

it("Names the same colors in every gamut", () => {
  const names = (options) => Object.keys(createColors(options)).sort();

  expect(names({ gamut: "display-p3" })).toStrictEqual(names({}));
  expect(names({ gamut: "rec2020" })).toStrictEqual(names({}));
});

it("Recovers chroma a wider gamut can show", () => {
  const chroma = (value) => Number(value.split(" ")[1]);

  // Vibrant asks for far more chroma than sRGB can hold, so the wider gamuts
  // have something to give back. Each gamut contains the previous one, so
  // chroma can only ever grow.
  const options = { variant: "vibrant", "spec-version": "2025" };
  const p3 = createColors({ ...options, gamut: "display-p3" });
  const rec2020 = createColors({ ...options, gamut: "rec2020" });

  expect(chroma(rec2020["primary-60"])).toBeGreaterThan(
    chroma(p3["primary-60"]),
  );
});

/**
 * The luminance an `oklch()` value resolves to, on the 0..100 scale
 * `lstarFromY` expects. Oklab's own lightness is not L*, so the only way to
 * check a tone survived is to go back to Y.
 * @param {string} css
 * @returns {number}
 */
function yFromOklch(css) {
  const [lightness, chroma, hue] = css.slice(6, -1).split(" ").map(Number);
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);

  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (lightness - 0.0894841775 * a - 1.29148555 * b) ** 3;

  const red =
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short;
  const green =
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short;
  const blue =
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short;

  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) * 100;
}

it("Keeps the tone, and so the contrast, of every color", async () => {
  // Material expresses its contrast guarantees in tone, so a wider gamut must
  // only ever spend chroma. Tone is the one thing it may not touch.
  const { Hct, argbFromHex, lstarFromY } =
    await import("@material/material-color-utilities");
  const { oklchFromHct } = await import("./color.js");

  const hue = Hct.fromInt(argbFromHex("#0c1445")).hue;

  for (const gamut of ["srgb", "display-p3", "rec2020"]) {
    for (const tone of [10, 30, 50, 70, 90]) {
      // Chroma well past what any gamut holds, so the fit has to give some up
      const tail = oklchFromHct(hue, 120, tone, gamut);

      expect(lstarFromY(yFromOklch(tail))).toBeCloseTo(tone, 2);
    }
  }
});

it("Rejects an unknown gamut", () => {
  expect(() => createColors({ gamut: "cmyk" })).toThrowError(
    /not a supported gamut/,
  );
});

it("Requires a source color", () => {
  // @ts-expect-error deliberately missing options
  expect(() => materialTailwind().config).toThrowError(/source color/);
  expect(() => materialTailwind({}).config).toThrowError(/source color/);
});

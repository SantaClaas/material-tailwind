import { expect, it } from "vitest";
import materialTailwind from ".";

/**
 * @param {Record<string, unknown>} options
 * @returns {Record<string, any>}
 */
function createColors(options) {
  return materialTailwind({ sourceColor: "#0c1445", ...options }).config.theme
    .extend.colors;
}

// This test is rather simple and more of a smoke test to ensure in CI that we build the dependency correctly
it("Can create a Material design TailwindCSS configuration", async () => {
  const plugin = materialTailwind({ sourceColor: "#0c1445" });

  const themeJson = JSON.stringify(plugin.config.theme, null, 2);
  await expect(themeJson).toMatchFileSnapshot("./theme test.snapshot.json");
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

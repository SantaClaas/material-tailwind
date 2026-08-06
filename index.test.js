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
  expect(() => createColors({ variant: "nope" })).toThrowError(/not a Material/);
  expect(() => createColors({ "spec-version": "2030" })).toThrowError(
    /not a Material/,
  );
});

it("Requires a source color", () => {
  // @ts-expect-error deliberately missing options
  expect(() => materialTailwind().config).toThrowError(/source color/);
  expect(() => materialTailwind({}).config).toThrowError(/source color/);
});

import { expect, it } from "vitest";
import materialTailwind from ".";

// This test is rather simple and more of a smoke test to ensure in CI that we build the dependency correctly
it("Can create a Material design TailwindCSS configuration", () => {
  const plugin = materialTailwind({ source: "#0c1445" });

  const themeJson = JSON.stringify(plugin.config.theme, null, 2);
  expect(themeJson).toMatchFileSnapshot("./theme test.snapshot.json");
});

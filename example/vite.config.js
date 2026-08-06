import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative asset URLs so the build works from any path, like the
  // /material-tailwind/ subdirectory GitHub Pages serves the example from.
  // Vite ignores this in dev and serves from "/" as usual.
  base: "./",
  plugins: [tailwindcss(), solid()],
});

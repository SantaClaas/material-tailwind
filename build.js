import fs from "node:fs";
import { spawnSync } from "node:child_process";

// Create directory `@material/material-color-utilities` for material color utilities build output
// Go into cloned material color utilities repository typescript subdirectory
// Run `npm install` to install dependencies
// Copmpile color utilites
// Run `tsc --outDir ../../@material/material-color-utilities/`
console.log("Opening git submodule");
process.chdir("material-color-utilities/typescript");
console.log("Install dependencies");
spawnSync("npm", ["install"], { stdio: "inherit" });
console.log("Compile color utilities");
spawnSync(
  "npx",
  ["tsc", "--outDir", "../../@material/material-color-utilities/"],
  {
    stdio: "inherit",
  }
);

console.log("Copying meta files: LICENSE, README.md and package.json");
// Their license has to be included in the build output
fs.copyFileSync("LICENSE", "../../@material/material-color-utilities/LICENSE");
fs.copyFileSync(
  "README.md",
  "../../@material/material-color-utilities/README.md"
);
fs.copyFileSync(
  "package.json",
  "../../@material/material-color-utilities/package.json"
);

console.log("Build completed");

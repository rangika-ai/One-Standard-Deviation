import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = await readFile(resolve(root, "dist/index.html"), "utf8");
const cssPath = html.match(/href="([^"]+\.css)"/)?.[1];
const jsPath = html.match(/src="([^"]+\.js)"/)?.[1];

if (!cssPath || !jsPath) throw new Error("Built CSS or JavaScript asset was not found");

const asset = (path) => resolve(root, "dist", path.replace(/^\/One-Standard-Deviation\//, ""));
const [css, js] = await Promise.all([readFile(asset(cssPath), "utf8"), readFile(asset(jsPath), "utf8")]);
const standalone = html
  .replace(/\s*<link rel="stylesheet"[^>]+>/, () => `\n    <style>${css}</style>`)
  .replace(/\s*<script type="module"[^>]+><\/script>/, () => `\n    <script type="module">${js}</script>`);

await writeFile(resolve(root, "fractal-structure-lab.html"), standalone);
console.log("Created fractal-structure-lab.html");

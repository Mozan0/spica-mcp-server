/*
 post-build helper: rewrites local ESM imports in dist/*.js to include .js extensions
 so compiled output can be run under Node ESM while allowing TypeScript sources
 to import extensionless paths during development (tsx).
*/
import fs from "fs";
import path from "path";

function rewriteFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  // Add .js extension for local relative imports that reference .ts/.js-less paths
  const replaced = text.replace(/from\s+(["'])(\.\/[^"']+?)\1/g, (m, q, p) => {
    // If it already ends with .js or .json, skip
    if (/\.js$|\.json$/.test(p)) return `from ${q}${p}${q}`;
    // If path points to a directory (no extension), add .js
    return `from ${q}${p}.js${q}`;
  });
  fs.writeFileSync(filePath, replaced, "utf8");
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (full.endsWith(".js")) rewriteFile(full);
  }
}

const dist = path.resolve(process.cwd(), "dist");
if (!fs.existsSync(dist)) {
  console.error("dist directory not found, run tsc first");
  process.exit(1);
}
walk(dist);

import { readFileSync } from "fs";

const src = readFileSync(new URL("../src/data/packs.ts", import.meta.url), "utf8");
const lineRe =
  /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*plies:\s*\[((?:[^[\]]|\n)+)\]/g;

let m;
const rows = [];
while ((m = lineRe.exec(src))) {
  const plies = [...m[3].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  if (plies.length === 0) continue;
  rows.push({ id: m[1], name: m[2], n: plies.length });
}
const short = rows.filter((r) => r.n < 20);
console.log(`lines=${rows.length} min=${Math.min(...rows.map((r) => r.n))} max=${Math.max(...rows.map((r) => r.n))} under20=${short.length}`);
for (const r of short) console.log(`SHORT ${r.id} ${r.n} ${r.name}`);

import { readFileSync } from "fs";
import { Chess } from "chess.js";

const src = readFileSync(new URL("../src/data/packs.ts", import.meta.url), "utf8");
const pricing = readFileSync(new URL("../src/data/pricing.ts", import.meta.url), "utf8");

const priceFields = [...src.matchAll(/^\s*price: (null|"[^"]+"),/gm)].map((m) => m[1]);
const badPrices = priceFields.filter((field) => field !== "null" && field !== '"£1.99"');
if (!/PRICE_PACK = "£1\.99"/.test(pricing)) {
  console.log("FAIL PRICE_PACK is not £1.99");
  process.exitCode = 1;
}
if (!/PRICE_LESSON_SCOTCH = "£2\.99"/.test(pricing)) {
  console.log("FAIL PRICE_LESSON_SCOTCH must stay £2.99");
  process.exitCode = 1;
}
if (!/PRICE_CARO_REST = "£1\.99"/.test(pricing) || !/PRICE_OPENING_TRAPS = "£1\.99"/.test(pricing)) {
  console.log("FAIL Caro rest or Opening Traps is not £1.99");
  process.exitCode = 1;
}
if (badPrices.length) {
  console.log(`FAIL pack price fields must be null or £1.99: ${badPrices.join(", ")}`);
  process.exitCode = 1;
}
const poundLabels = [...src.matchAll(/closedLabel: "([^"]*£[^"]*)"/g)].map((m) => m[1]);
const badLabels = poundLabels.filter((label) => !label.includes("£1.99"));
if (badLabels.length) {
  console.log(`FAIL closedLabel prices must be £1.99: ${badLabels.join(" | ")}`);
  process.exitCode = 1;
}
console.log(
  `prices fields=${priceFields.length} non-null=${priceFields.filter((f) => f !== "null").length} bad=${badPrices.length}`,
);

const lineRe =
  /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*plies:\s*\[((?:[^[\]]|\n)+)\]/g;

const lines = [];
let m;
while ((m = lineRe.exec(src))) {
  const id = m[1];
  const name = m[2];
  const raw = m[3];
  const plies = [...raw.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  if (plies.length === 0) continue;
  lines.push({ id, name, plies });
}

let fails = 0;
const reports = [];

for (const line of lines) {
  const game = new Chess();
  for (let i = 0; i < line.plies.length; i++) {
    const san = line.plies[i];
    const legal = game.moves({ verbose: true });
    const match = legal.find((mv) => mv.san === san);
    if (!match) {
      let viaMove = null;
      try {
        const tmp = new Chess(game.fen());
        const res = tmp.move(san);
        viaMove = res ? res.san : null;
        if (res) {
          game.move(res);
          continue;
        }
      } catch {
        viaMove = null;
      }
      fails += 1;
      reports.push({
        id: line.id,
        name: line.name,
        ply: i,
        san,
        canonical: viaMove,
        legalSample: legal.slice(0, 12).map((mv) => mv.san),
      });
      break;
    }
    game.move(match);
  }
}

console.log(`lines=${lines.length} fails=${fails}`);
for (const r of reports) {
  console.log(
    `FAIL ${r.id} ${r.name} ply ${r.ply} got="${r.san}" canonical=${r.canonical} legal=[${r.legalSample.join(" ")}]`,
  );
}
if (fails !== 0) process.exitCode = 1;

import { readFileSync } from "fs";
import { Chess } from "chess.js";

const src = readFileSync(new URL("../src/data/packs.ts", import.meta.url), "utf8");

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

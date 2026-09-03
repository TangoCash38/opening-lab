import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const train = src("src/components/opening-lab/train-view.tsx");
const modal = src("src/components/opening-lab/line-result-modal.tsx");
const catalog = src("src/lib/catalog.ts");
const packs = src("src/data/packs.ts");
const i18n = src("src/lib/i18n.ts");
const shell = src("src/components/opening-lab/app-shell.tsx");
const hero = src("src/components/opening-lab/home-hero.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");

test("wrong-move popup names the book SAN only", () => {
  assert.match(train, /The book move is \{san\}\./);
  assert.match(train, /san: exp\.san/);
  assert.match(train, /kind: "wrong"/);
  assert.doesNotMatch(train, /because the engine/);
});

test("end-of-line popup prefers line.next, else the catalog idea", () => {
  assert.match(train, /body: \(line\.next \?\? line\.idea \?\? ""\)\.trim\(\)/);
  assert.match(train, /kind: "end"/);
  assert.match(modal, /data-result-kind/);
  assert.match(modal, /z-\[80\]/);
  assert.match(packs, /next\?: string/);
  assert.doesNotMatch(packs, /next: "/);
  assert.doesNotMatch(packs, /next: `/);
});

test("end modal has two buttons; wrong has one", () => {
  assert.match(modal, /data-result-actions=\{showPrimary \? 2 : 1\}/);
  assert.match(modal, /kind === "end" && Boolean\(primaryLabel && onPrimary\)/);
  assert.match(modal, /data-result-primary/);
  assert.match(modal, /data-result-dismiss/);
  assert.match(train, /t\("Well done"\)/);
  assert.match(train, /t\("Practice next line"\)/);
  assert.match(train, /primaryLabel: nextLine \? t\("Practice next line"\) : undefined/);
  assert.match(train, /actionLabel: t\("Well done"\)/);
  assert.match(train, /actionLabel: t\("Try again"\)/);
  const wrongStart = train.indexOf('kind: "wrong",');
  assert.ok(wrongStart > 0);
  const wrongBlock = train.slice(wrongStart, train.indexOf("});", wrongStart) + 3);
  assert.match(wrongBlock, /Try again/);
  assert.doesNotMatch(wrongBlock, /primaryLabel/);
  assert.doesNotMatch(wrongBlock, /Well done/);
  assert.doesNotMatch(wrongBlock, /Practice next line/);
  for (const key of ["Well done", "Practice next line"]) {
    assert.match(i18n, new RegExp(`"${key}": "${key}"`));
    assert.match(i18n, /"Bien hecho"|"做得好"|"Bravo"/);
  }
  assert.match(i18n, /"Well done": "Bien hecho"/);
  assert.match(i18n, /"Well done": "做得好"/);
  assert.match(i18n, /"Well done": "Bravo"/);
  assert.match(i18n, /"Practice next line": "Practicar la siguiente línea"/);
  assert.match(i18n, /"Practice next line": "练习下一条线路"/);
  assert.match(i18n, /"Practice next line": "Practice la ligne suivante"/);
});

test("practice next line skips locked Caro extras and starts Practice", () => {
  assert.match(catalog, /export function nextUnlockedLine/);
  assert.match(catalog, /slice\(idx \+ 1\)/);
  assert.match(catalog, /isLineUnlocked\(pack, l\.id, purchasedPackIds\)/);
  assert.match(catalog, /"caro-kann-black": \["ckb1", "ckb3", "ckb5"\]/);
  assert.match(train, /nextUnlockedLine\(pack, line\.id, purchased\)/);
  assert.match(train, /onPracticeNext\?\.\(nextLine\)/);
  assert.match(shell, /onPracticeNext=\{\(nextLine\) =>/);
  assert.match(shell, /startLine\(active\.pack, nextLine, "learn"\)/);
  assert.match(hero, /onStartLine\(pack, line, "learn"\)/);
  assert.match(hero, /shouldSkipPackIntro/);
  assert.match(list, /!shouldSkipPackIntro\(\)/);
  assert.match(list, /onStartLine\(pack, line\)/);

  const sample = ["ckb1", "ckb3", "ckb5"];
  const caro = Array.from({ length: 18 }, (_, i) => `ckb${i + 1}`);
  function isLineUnlocked(packId, lineId, purchased) {
    const ids = packId === "caro-kann-black" ? sample : null;
    if (!ids) return true;
    if (ids.includes(lineId)) return true;
    return purchased.includes(packId);
  }
  function nextUnlockedLine(lines, current, packId, purchased) {
    const idx = lines.indexOf(current);
    if (idx < 0) return undefined;
    return lines.slice(idx + 1).find((id) => isLineUnlocked(packId, id, purchased));
  }
  assert.equal(nextUnlockedLine(caro, "ckb1", "caro-kann-black", []), "ckb3");
  assert.equal(nextUnlockedLine(caro, "ckb3", "caro-kann-black", []), "ckb5");
  assert.equal(nextUnlockedLine(caro, "ckb5", "caro-kann-black", []), undefined);
  assert.equal(nextUnlockedLine(caro, "ckb4", "caro-kann-black", []), "ckb5");
  assert.equal(
    nextUnlockedLine(caro, "ckb1", "caro-kann-black", ["caro-kann-black"]),
    "ckb2",
  );
  assert.equal(nextUnlockedLine(caro, "ckb18", "caro-kann-black", ["caro-kann-black"]), undefined);
  const qgd = Array.from({ length: 18 }, (_, i) => `qgdb${i + 1}`);
  assert.equal(nextUnlockedLine(qgd, "qgdb1", "qgd-black", []), "qgdb2");
  assert.equal(nextUnlockedLine(qgd, "qgdb18", "qgd-black", []), undefined);
});

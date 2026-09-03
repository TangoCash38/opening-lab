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
const css = src("src/styles.css");
const shell = src("src/components/opening-lab/app-shell.tsx");
const hero = src("src/components/opening-lab/home-hero.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");

function kindBlocks(source, kind) {
  const blocks = [];
  let from = 0;
  const needle = `kind: "${kind}",`;
  while (true) {
    const start = source.indexOf(needle, from);
    if (start < 0) break;
    const end = source.indexOf("});", start);
    blocks.push(source.slice(start, end + 3));
    from = start + 1;
  }
  return blocks;
}

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
  assert.doesNotMatch(packs, /next: `/);
});

test("Caro line-complete next notes: ckb1.next exists; ckb12 recommends Qb4 and warns off Qa3", () => {
  const start = packs.indexOf('id: "caro-kann-black"');
  assert.ok(start >= 0, "caro-kann-black pack missing");
  const nextPack = packs.indexOf("\n  {\n    id: \"", start + 1);
  const ck = nextPack >= 0 ? packs.slice(start, nextPack) : packs.slice(start);

  function lineNext(id) {
    const s = ck.indexOf(`id: "${id}"`);
    assert.ok(s >= 0, `${id} missing`);
    const n = Number(id.slice(3));
    const end = n === 18 ? ck.length : ck.indexOf(`id: "ckb${n + 1}"`, s);
    const block = ck.slice(s, end);
    const m = block.match(/next: "((?:\\.|[^"\\])*)"/);
    assert.ok(m, `${id}.next missing`);
    return m[1];
  }

  const ckb1 = lineNext("ckb1");
  assert.ok(ckb1.length > 0, "ckb1.next exists");

  const ckb12 = lineNext("ckb12");
  assert.match(ckb12, /Qb4/);
  assert.match(ckb12, /Qb6/);
  assert.match(ckb12, /Do not play …Qa3/);
  assert.match(ckb12, /hangs to Nxa3/);
  const bring = ckb12.match(/Bring it out with [^.]+/);
  assert.ok(bring, "ckb12 bring-it-out sentence missing");
  assert.doesNotMatch(bring[0], /Qa3/);
});

test("end modal has two buttons; Practice wrong has one", () => {
  assert.match(modal, /data-result-actions=\{showPrimary \? 2 : 1\}/);
  assert.match(modal, /Boolean\(primaryLabel && onPrimary\)/);
  assert.match(modal, /onAction \?\? onClose/);
  assert.match(modal, /data-result-primary/);
  assert.match(modal, /data-result-dismiss/);
  assert.match(train, /t\("Well done"\)/);
  assert.match(train, /t\("Practice next line"\)/);
  assert.match(train, /t\("Test yourself"\)/);
  assert.match(train, /nextAction === "practiceNext" && nextLine/);
  assert.match(train, /actionLabel: t\("Well done"\)/);
  assert.match(train, /t\("Try again"\)/);
  const wrongs = kindBlocks(train, "wrong");
  assert.equal(wrongs.length, 2);
  const practiceWrong = wrongs[1];
  assert.match(practiceWrong, /Wrong move/);
  assert.match(practiceWrong, /Try again/);
  assert.doesNotMatch(practiceWrong, /primaryLabel/);
  assert.doesNotMatch(practiceWrong, /Inaccurate move/);
  assert.doesNotMatch(practiceWrong, /Back to practice/);
  assert.doesNotMatch(practiceWrong, /Well done/);
  assert.doesNotMatch(practiceWrong, /Practice next line/);
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

test("Practice complete offers Test yourself; clean Test offers next line", () => {
  const learnAt = train.indexOf('t("Practice done")');
  assert.ok(learnAt > 0, "learn end card missing");
  const learnCall = train.slice(train.lastIndexOf("endResultCard", learnAt), train.indexOf(");", learnAt) + 2);
  assert.match(learnCall, /"testYourself"/);
  assert.doesNotMatch(learnCall, /practiceNext/);
  assert.doesNotMatch(learnCall, /Practice next line/);
  assert.match(train, /t\("Test yourself"\)/);
  assert.match(train, /nextAction === "testYourself"/);
  assert.match(train, /changeMode\("practice"\)/);

  const cleanAt = train.indexOf('t("Line complete")');
  assert.ok(cleanAt > 0, "clean Test end card missing");
  const cleanCall = train.slice(train.lastIndexOf("endResultCard", cleanAt), train.indexOf(");", cleanAt) + 2);
  assert.match(cleanCall, /"practiceNext"/);
  assert.doesNotMatch(cleanCall, /testYourself/);
  assert.match(
    train,
    /nextAction === "practiceNext" && nextLine\s*\?\s*t\("Practice next line"\)/,
  );

  const missedAt = train.indexOf('t("Finished, but you missed a move")');
  assert.ok(missedAt > 0, "missed Test end card missing");
  const missedCall = train.slice(train.lastIndexOf("endResultCard", missedAt), train.indexOf(");", missedAt) + 2);
  assert.doesNotMatch(missedCall, /practiceNext/);
  assert.doesNotMatch(missedCall, /testYourself/);
  assert.doesNotMatch(missedCall, /primaryLabel/);

  const wrongs = kindBlocks(train, "wrong");
  assert.equal(wrongs.length, 2);
  const testWrong = wrongs[0];
  assert.match(testWrong, /Inaccurate move/);
  assert.match(testWrong, /Try again/);
  assert.match(testWrong, /Back to practice/);
  assert.match(testWrong, /primaryLabel: t\("Try again"\)/);
  assert.match(testWrong, /nextAction: "learn"/);
  assert.doesNotMatch(testWrong, /Practice again/);
  assert.doesNotMatch(testWrong, /Practice next line/);
  assert.doesNotMatch(testWrong, /Test yourself/);
  const practiceWrong = wrongs[1];
  assert.match(practiceWrong, /Wrong move/);
  assert.match(practiceWrong, /Try again/);
  assert.doesNotMatch(practiceWrong, /primaryLabel/);
  assert.doesNotMatch(practiceWrong, /Back to practice/);
  assert.match(train, /onClose=\{\(\) => setResultCard\(null\)\}/);
  assert.match(train, /onAction=/);
  assert.match(train, /resultCard\.nextAction === "learn"/);
  assert.match(train, /changeMode\("learn"\)/);
  const modalCall = train.slice(train.indexOf("<LineResultModal"), train.indexOf("</LineResultModal>"));
  assert.match(modalCall, /onClose=\{\(\) => setResultCard\(null\)\}/);
  assert.doesNotMatch(modalCall, /onClose=\{\(\) => \{\s*if \(resultCard\.nextAction === "learn"\)/);

  assert.match(i18n, /"Test yourself": "Test yourself"/);
  assert.match(i18n, /"Test yourself": "Ponte a prueba"/);
  assert.match(i18n, /"Test yourself": "自我测试"/);
  assert.match(i18n, /"Test yourself": "Teste-toi"/);
  assert.match(i18n, /"Practice again": "Practice again"/);
  assert.match(i18n, /"Practice again": "Practicar de nuevo"/);
  assert.match(i18n, /"Practice again": "再练习"/);
  assert.match(i18n, /"Practice again": "Pratiquer encore"/);
  assert.match(i18n, /"Inaccurate move": "Inaccurate move"/);
  assert.match(i18n, /"Inaccurate move": "Jugada inexacta"/);
  assert.match(i18n, /"Inaccurate move": "不准确的着法"/);
  assert.match(i18n, /"Inaccurate move": "Coup imprécis"/);
  assert.match(i18n, /"Back to practice": "Back to practice"/);
  assert.match(i18n, /"Back to practice": "Volver a practicar"/);
  assert.match(i18n, /"Back to practice": "返回练习"/);
  assert.match(i18n, /"Back to practice": "Retour à Practice"/);
});


test("result sheet sits under the board so file letters stay readable", () => {
  assert.match(modal, /line-result-overlay/);
  assert.match(modal, /line-result-sheet/);
  assert.match(modal, /line-result-body/);
  assert.match(modal, /z-\[80\]/);
  assert.match(modal, /data-result-sheet/);
  assert.doesNotMatch(modal, /bg-black\/40/);
  assert.doesNotMatch(modal, /sm:items-center/);
  assert.match(css, /\.line-result-overlay/);
  assert.match(css, /align-items:\s*flex-end/);
  assert.match(css, /background:\s*transparent/);
  assert.match(css, /\.line-result-sheet/);
  assert.match(css, /max-height:\s*min\(32dvh/);
  assert.match(css, /100vw/);
  assert.match(css, /\.line-result-body/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /\.train-board-anchor/);
  assert.match(css, /scroll-margin-bottom/);
  assert.match(css, /\.train-result-pad/);
  assert.match(train, /scrollIntoView/);
  assert.match(train, /train-board-anchor/);
  assert.match(train, /train-result-pad/);
  assert.match(train, /boardWrapRef/);
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
  assert.doesNotMatch(hero, /if \(shouldSkipPackIntro\(\)\) startAdvance/);
  assert.match(hero, /setAboutOpen\(true\)/);
  assert.match(list, /onStartLine\(pack, line\)/);

  const sample = ["ckb1", "ckb3", "ckb5"];
  const caro = Array.from({ length: 18 }, (_, i) => `ckb${i + 1}`);
  function isLineUnlocked(packId, lineId, purchased) {
    const ids = packId === "caro-kann-black" ? sample : null;
    if (ids) {
      if (ids.includes(lineId)) return true;
      return purchased.includes(packId);
    }
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
  assert.equal(nextUnlockedLine(qgd, "qgdb1", "qgd-black", []), undefined);
  assert.equal(nextUnlockedLine(qgd, "qgdb1", "qgd-black", ["qgd-black"]), "qgdb2");
  assert.equal(nextUnlockedLine(qgd, "qgdb18", "qgd-black", ["qgd-black"]), undefined);
  const nimzo = Array.from({ length: 18 }, (_, i) => `nl${i + 1}`);
  assert.equal(nextUnlockedLine(nimzo, "nl1", "nimzo-larsen-white", []), undefined);
  assert.equal(
    nextUnlockedLine(nimzo, "nl1", "nimzo-larsen-white", ["nimzo-larsen-white"]),
    "nl2",
  );
});

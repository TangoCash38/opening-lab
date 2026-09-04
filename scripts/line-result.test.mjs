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


test("Test miss status guides Reset or Practice; Practice miss stays try again", () => {
  const tryPlay = train.slice(train.indexOf("const tryPlay"), train.indexOf("const onSquare"));
  assert.match(
    tryPlay,
    /mode === "practice"\s*\?\s*t\("Tap Reset to try again, or go back to Practice"\)/,
  );
  assert.match(tryPlay, /t\("Wrong move — try again"\)/);
  assert.doesNotMatch(tryPlay, /setStatus\(\{ text: "Wrong move — try again"/);
  const wrongs = kindBlocks(train, "wrong");
  assert.equal(wrongs.length, 2);
  const testWrong = wrongs[0];
  assert.match(testWrong, /primaryLabel: t\("Try again"\)/);
  assert.match(testWrong, /actionLabel: t\("Back to practice"\)/);
  assert.match(testWrong, /title: t\("Inaccurate move"\)/);
  assert.equal(i18n.split('"Wrong move — try again":').length - 1, 12);
  assert.equal(
    i18n.split('"Tap Reset to try again, or go back to Practice":').length - 1,
    12,
  );
  assert.match(i18n, /"Wrong move — try again": "Wrong move — try again"/);
  assert.match(
    i18n,
    /"Tap Reset to try again, or go back to Practice": "Tap Reset to try again, or go back to Practice"/,
  );
  assert.match(i18n, /"Wrong move — try again": "Jugada incorrecta — inténtalo de nuevo"/);
  assert.match(i18n, /"Wrong move — try again": "走错了 — 再试一次"/);
  assert.match(i18n, /"Wrong move — try again": "Mauvais coup — réessaie"/);
  assert.match(
    i18n,
    /"Tap Reset to try again, or go back to Practice": "Touche Reset pour réessayer, ou reviens à Practice"/,
  );
});

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
  assert.match(css, /max-height:\s*min\(42dvh/);
  assert.match(css, /100vw/);
  assert.match(css, /\.line-result-body/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /\.train-board-anchor/);
  assert.match(css, /scroll-margin-bottom/);
  // Finish sheet is position:fixed — no pad or scrollIntoView jump when it opens.
  assert.doesNotMatch(css, /\.train-result-pad/);
  assert.doesNotMatch(train, /scrollIntoView/);
  assert.match(train, /train-board-anchor/);
  assert.doesNotMatch(train, /train-result-pad/);
  assert.doesNotMatch(train, /boardWrapRef/);
});

test("practice next line skips locked Caro extras and starts Practice", () => {
  assert.match(catalog, /export function nextUnlockedLine/);
  assert.match(catalog, /slice\(idx \+ 1\)/);
  assert.match(catalog, /isLineUnlocked\(pack, l\.id, purchasedPackIds\)/);
  assert.match(catalog, /"caro-kann-black": \["ckb1", "ckb3", "ckb5"\]/);
  assert.match(train, /nextUnlockedLine\(pack, line\.id, unlockIds\)/);
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

test("finish sheet shows a scroll cue when plan text overflows", () => {
  assert.match(modal, /line-result-body-wrap/);
  assert.match(modal, /line-result-body/);
  assert.match(modal, /data-result-scrollable/);
  assert.match(modal, /data-result-scrollable=\{hasOverflow \? "1" : undefined\}/);
  assert.match(modal, /line-result-scroll-fade/);
  assert.match(modal, /line-result-scroll-hint/);
  assert.match(modal, /t\("Scroll for more"\)/);
  assert.match(modal, /ChevronDown/);
  assert.match(modal, /ResizeObserver/);
  assert.match(modal, /addEventListener\("scroll"/);
  assert.match(modal, /scrollHeight > .*clientHeight \+ 4/);
  assert.match(modal, /useT\(\)/);
  assert.equal(i18n.split('"Scroll for more":').length - 1, 12);
  assert.match(i18n, /"Scroll for more": "Scroll for more"/);
  assert.match(i18n, /"Scroll for more": "Desliza para ver más"/);
  assert.match(i18n, /"Scroll for more": "下滑查看更多"/);
  assert.match(i18n, /"Scroll for more": "Fais défiler pour plus"/);
  assert.match(i18n, /"Scroll for more": "Nach unten scrollen"/);
  assert.match(i18n, /"Scroll for more": "Role para ver mais"/);
  assert.match(i18n, /"Scroll for more": "Прокрути ещё"/);
  assert.match(i18n, /"Scroll for more": "Scorri per altro"/);
  assert.match(i18n, /"Scroll for more": "और देखने के लिए स्क्रॉल करें"/);
  assert.match(i18n, /"Scroll for more": "下にスクロール"/);
  assert.match(i18n, /"Scroll for more": "مرّر للمزيد"/);
  assert.match(i18n, /"Scroll for more": "Daha fazlası için kaydır"/);
  assert.match(css, /\.line-result-body-wrap/);
  assert.match(css, /\.line-result-body-wrap[\s\S]*position:\s*relative/);
  assert.match(css, /\.line-result-body[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.line-result-scroll-fade/);
  assert.match(css, /\.line-result-scroll-hint/);
  assert.match(css, /--color-bg-elevated/);
  assert.match(css, /html\[data-color-scheme="dark"\] \.line-result-scroll-fade/);
  assert.match(css, /max-height:\s*min\(42dvh/);
});


test("end finish sheets expose Play on Level 1/2/3; wrong-move cards do not", () => {
  assert.match(modal, /playOnLevels\?/);
  assert.match(modal, /onPlayOn\?/);
  assert.match(modal, /kind === "end"/);
  assert.match(modal, /data-result-play-on/);
  assert.match(modal, /data-result-play-on-open/);
  assert.match(modal, /data-result-play-on-btn/);
  assert.match(modal, /playOnPrompt/);
  assert.match(modal, /Pick a level, then Play on/);
  assert.match(modal, /play-level-chip/);
  assert.match(modal, /line-result-actions-row/);
  assert.match(modal, /line-result-actions-or/);
  assert.match(modal, /t\("or"\)/);
  assert.match(css, /\.line-result-actions-row/);
  assert.match(css, /\.line-result-actions-or/);
  assert.match(i18n, /or: "or"/);
  assert.match(css, /\.line-result-play-prompt \.play-level-chip/);
  assert.match(train, /resultCard\.kind === "end"/);
  assert.match(train, /setResultCard\(null\);\s*startPlayOn\(\)/);
  assert.match(train, /PLAY_LEVEL_LABEL\[id\]/);
  const modalCall = train.slice(train.indexOf("<LineResultModal"), train.indexOf("</LineResultModal>"));
  assert.match(modalCall, /playOnLevels=/);
  assert.match(modalCall, /onPlayOn=/);
  assert.match(modalCall, /resultCard\.kind === "end"/);
  const wrongs = kindBlocks(train, "wrong");
  assert.equal(wrongs.length, 2);
  for (const w of wrongs) {
    assert.doesNotMatch(w, /playOnLevels/);
    assert.doesNotMatch(w, /startPlayOn/);
  }
  assert.match(css, /\.line-result-play-prompt/);
});

test("scrollAppTop on startLine/goHome; ChessBoard remounts on session; reset collapses board", () => {
  assert.match(shell, /function scrollAppTop\(\)/);
  assert.match(shell, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
  assert.match(shell, /scrollAppTop\(\)/);
  assert.match(shell, /requestAnimationFrame\(\(\) => scrollAppTop\(\)\)/);
  assert.match(train, /key=\{session\}/);
  assert.match(train, /setBoardExpanded\(false\)/);
  assert.match(train, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
});


test("finish sheet with Play on gets taller body so plan text is readable", () => {
  assert.match(modal, /line-result-sheet--play-on/);
  assert.match(modal, /showPlayOn \? " line-result-sheet--play-on"/);
  assert.match(modal, /data-result-has-play-on=\{showPlayOn \? "1" : undefined\}/);
  assert.match(css, /\.line-result-sheet--play-on/);
  assert.match(css, /max-height:\s*min\(52dvh/);
  assert.match(css, /\.line-result-sheet--play-on \.line-result-body[\s\S]*min-height:\s*10\.5rem/);
  assert.match(css, /\.line-result-sheet--play-on \.line-result-body-wrap[\s\S]*min-height:\s*10\.5rem/);
  // Default sheet still taller than the old 32dvh clip
  assert.match(css, /max-height:\s*min\(42dvh/);
  assert.doesNotMatch(css, /max-height:\s*min\(32dvh/);
});

test("TrainView remounts on line change only; Practice↔Test stays in place", () => {
  // Key must NOT include mode — remounting on Practice↔Test flashes an empty board
  assert.match(shell, /key=\{\`\$\{active\.pack\.id\}-\$\{active\.line\.id\}\`\}/);
  assert.doesNotMatch(
    shell,
    /key=\{\`\$\{active\.pack\.id\}-\$\{active\.line\.id\}-\$\{active\.mode\}\`\}/,
  );
  assert.match(shell, /onModeChange=\{\(mode\) =>/);
  assert.match(shell, /setActive\(\(prev\) => \(prev \? \{ \.\.\.prev, mode \} : prev\)\)/);
  assert.match(train, /onModeChange\?: \(mode: Mode\) => void/);
  assert.match(train, /onModeChange\?\.\(m\)/);
  const changeMode = train.match(/const changeMode = \(m: Mode\) => \{[\s\S]*?\};/);
  assert.ok(changeMode, "changeMode block");
  assert.match(changeMode[0], /setMode\(m\)/);
  assert.match(changeMode[0], /onModeChange\?\.\(m\)/);
  assert.match(changeMode[0], /resetLine\(m\)/);
  // Both ModeTab rows bind to the same local mode state
  assert.equal([...train.matchAll(/active=\{mode === "learn"\}/g)].length, 2);
  assert.equal([...train.matchAll(/active=\{mode === "practice"\}/g)].length, 2);
});

test("ModeTab nudge is additive and keeps active/inactive chrome", () => {
  assert.match(train, /function ModeTab\(/);
  assert.match(
    train,
    /active\s*\?\s*"bg-bg-elevated text-fg shadow-sm"[\s\S]*?bg-transparent text-fg-muted[\s\S]*?nudge \? " mode-tab-nudge"/,
  );
  assert.doesNotMatch(train, /nudge\s*\?\s*"mode-tab-nudge"\s*:/);
  assert.match(css, /\.mode-tab-nudge \{/);
  assert.doesNotMatch(
    css,
    /\.mode-tab-nudge \{[^}]*background:\s*var\(--color-accent\)/,
  );
});

import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");
const require = createRequire(join(root, "package.json"));

const LANGS = ["es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"];
const SAN =
  /(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)/g;
const NAMES = [
  "Professor Potato Pie",
  "Scotch Gambit",
  "Scotch",
  "Edinburgh–London",
  "Legal's Mate",
  "Monsieur de Légal",
  "Philidor",
  "Caro-Kann",
  "Horatio Caro",
  "Marcus Kann",
  "Nigel Short",
];
const UI_KEYS = [
  "Mute",
  "Unmute",
  "Practice",
  "Read the intro",
  "Hide the intro",
  "Voice in English",
  "Scotch Gambit · a cuppa and the open board",
  "Line 1 · ten lines from the gambit",
  "Opening Traps",
  "London System",
  "Italian Game",
  "Queen’s Gambit",
  "Line 1 · Legal's Mate",
  "Line 1",
];

function compile(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const dir = join(root, "scripts", ".generated-coach-i18n");
  mkdirSync(dir, { recursive: true });
  const options = {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  };
  const scotchJs = ts.transpileModule(src("src/lib/scotch-coach.ts"), options).outputText;
  writeFileSync(join(dir, "scotch-coach.mjs"), scotchJs);
  const stemJs = ts.transpileModule(src("src/lib/caro-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "caro-intro-stem.mjs"), stemJs);
  const londonJs = ts.transpileModule(src("src/lib/london-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "london-intro-stem.mjs"), londonJs);
  const qgJs = ts.transpileModule(src("src/lib/qg-intro-stem.ts"), options).outputText;
  writeFileSync(join(dir, "qg-intro-stem.mjs"), qgJs);
  const packsJs = ts
    .transpileModule(src("src/lib/coach-packs.ts"), options)
    .outputText.replaceAll("@/lib/scotch-coach", "./scotch-coach.mjs")
    .replaceAll("@/lib/caro-intro-stem", "./caro-intro-stem.mjs")
    .replaceAll("@/lib/london-intro-stem", "./london-intro-stem.mjs")
    .replaceAll("@/lib/qg-intro-stem", "./qg-intro-stem.mjs");
  writeFileSync(join(dir, "coach-packs.mjs"), packsJs);
  const i18nJs = ts.transpileModule(src("src/lib/coach-i18n.ts"), options).outputText;
  writeFileSync(join(dir, "coach-i18n.mjs"), i18nJs);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

test("every coach caption has a translation in every supported language", async (t) => {
  const dir = compile(t);
  if (!dir) return;
  const { COACH_PACKS } = await import(pathToFileURL(join(dir, "coach-packs.mjs")).href);
  const { COACH_CAPTIONS, COACH_UI } = await import(
    pathToFileURL(join(dir, "coach-i18n.mjs")).href
  );
  const i18n = src("src/lib/i18n.ts");
  const intro = src("src/components/opening-lab/scotch-coach-intro.tsx");
  const train = src("src/components/opening-lab/train-view.tsx");
  const copy = src("src/lib/coach-i18n.ts");

  assert.match(i18n, /withCoachCopy/);
  assert.match(i18n, /COACH_CAPTIONS\[lang\]/);
  assert.match(i18n, /COACH_UI\[lang\]/);
  assert.equal(i18n.includes('"Caro-Kann for Black":'), false);
  assert.doesNotMatch(
    copy,
    /speechSynthesis|SpeechSynthesisUtterance|human voice|recorded by|voice actor/i,
  );
  assert.doesNotMatch(intro, /speechSynthesis|SpeechSynthesisUtterance/i);
  assert.match(intro, /data-coach-voice-note/);
  assert.match(intro, /t\("Voice in English"\)/);
  assert.match(intro, /lang === "en"/);
  assert.match(intro, /t\("Mute"\)/);
  assert.match(intro, /t\("Unmute"\)/);
  assert.match(intro, /t\("Skip"\)/);
  assert.match(intro, /t\("Next"\)/);
  assert.match(intro, /t\("Practice"\)/);
  assert.match(intro, /t\("Read the intro"\)/);
  assert.match(intro, /t\("Hide the intro"\)/);
  assert.match(intro, /function CoachPackReading/);
  assert.match(train, /CoachPackReading/);
  assert.match(train, /pack\.id === SCOTCH_PACK_ID \? <ScotchCoachReading \/>/);

  assert.equal(COACH_CAPTIONS.en, undefined);
  assert.equal(COACH_UI.en["Voice in English"], "Voice in English");
  assert.equal(COACH_UI.es["Caro-Kann for Black"], undefined);

  const packIds = Object.keys(COACH_PACKS).sort();
  assert.deepEqual(packIds, ["caro-kann-black", "italian-white", "london", "opening-traps", "qg-white", "scotch"]);

  const captions = [];
  for (const pack of Object.values(COACH_PACKS)) {
    for (const beat of pack.introBeats) captions.push(beat);
    for (const beat of pack.firstLineBeats) {
      captions.push(beat.caption);
      if (beat.atSec != null) assert.equal(typeof beat.atSec, "number");
    }
    assert.equal(typeof pack.introAudioFallbackSec, "number");
  }
  assert.equal(new Set(captions).size, captions.length);
  assert.ok(captions.length >= 60, `expected the spoken segments, got ${captions.length}`);

  for (const caption of captions) {
    assert.equal(caption, caption.trim());
    for (const lang of LANGS) {
      const value = COACH_CAPTIONS[lang]?.[caption];
      assert.equal(typeof value, "string", `${lang} missing caption`);
      assert.notEqual(value, caption, `${lang} left English: ${caption.slice(0, 48)}`);
      assert.ok(value.trim().length > 0, lang);
      for (const name of NAMES) {
        if (caption.includes(name)) {
          assert.ok(value.includes(name), `${lang} dropped ${name}`);
        }
      }
      if (caption.includes("In Practice")) assert.ok(value.includes("Practice"), lang);
      if (caption.includes("In Test")) assert.ok(value.includes("Test"), lang);
      for (const token of caption.match(SAN) ?? []) {
        assert.ok(value.includes(token), `${lang} dropped ${token}`);
      }
    }
  }

  for (const key of UI_KEYS) {
    for (const lang of LANGS) {
      const value = COACH_UI[lang]?.[key];
      assert.equal(typeof value, "string", `${lang} ${key}`);
      assert.notEqual(value, key, `${lang} left ${key} in English`);
      assert.doesNotMatch(value, /human|recorded|person|voice actor/i);
    }
  }
  for (const lang of LANGS) {
    assert.ok(COACH_UI[lang]["Line 1 · Legal's Mate"].includes("Legal's Mate"), lang);
    assert.ok(
      COACH_UI[lang]["Scotch Gambit · a cuppa and the open board"].includes("Scotch Gambit"),
      lang,
    );
  }
});

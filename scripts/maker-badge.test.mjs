import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const badge = src("src/components/opening-lab/maker-badge.tsx");
const copy = src("src/lib/maker-badge-copy.ts");
const i18n = src("src/lib/i18n.ts");
const landing = src("src/components/opening-lab/home-intro.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");
const browse = src("src/components/opening-lab/creator-packs-browse.tsx");
const creator = src("src/components/opening-lab/creator-packs-creator.tsx");
const css = src("src/styles.css");

const LANGS = ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"];

test("maker badge is a small gold mark with an untranslated name", () => {
  assert.match(badge, /OPENING_LAB_MAKER = "Opening Lab"/);
  assert.match(badge, /name = OPENING_LAB_MAKER/);
  assert.match(badge, /aria-label=\{label\}/);
  assert.match(badge, /translate="no"/);
  assert.match(badge, /data-maker-badge=\{maker\}/);
  assert.doesNotMatch(badge, /t\("Opening Lab"\)/);
  assert.match(css, /\.maker-badge\s*\{[^}]*#c9a227/);
  assert.match(css, /\.maker-badge-name\s*\{[^}]*text-overflow:\s*ellipsis/);
  assert.match(css, /\.maker-badge-row\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /\.maker-badge\s*\{[^}]*margin-inline-start:\s*auto/);
});

test("first-party pack cards and creator-pack cards use the same mark", () => {
  assert.match(landing, /<MakerBadge \/>/);
  assert.match(landing, /data-open-pack=\{pack\.id\}/);
  assert.match(list, /<MakerBadge \/>/);
  assert.match(list, /data-pack-card=\{pack\.id\}/);
  assert.match(browse, /<MakerBadge name=\{pack\.creatorName\} \/>/);
  assert.match(creator, /<MakerBadge name=\{name\} \/>/);
  assert.doesNotMatch(landing, /Official|Authentic|Verified by/i);
});

test("Made by label is localised in all 12 languages; the name is not", () => {
  for (const lang of LANGS) {
    assert.match(copy, new RegExp(`^  ${lang}:`, "m"), lang);
  }
  assert.equal(copy.split("{name}").length - 1, LANGS.length + 1);
  assert.match(i18n, /MAKER_BADGE_COPY/);
  assert.doesNotMatch(copy, /Opening Lab/);
  const run = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        import { MAKER_BADGE_COPY, MAKER_BADGE_LABEL } from "./src/lib/maker-badge-copy.ts";
        const langs = ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"];
        const seen = new Set();
        for (const lang of langs) {
          const template = MAKER_BADGE_COPY[lang]?.[MAKER_BADGE_LABEL];
          if (!template || !template.includes("{name}")) process.exit(2);
          const label = template.replaceAll("{name}", "Opening Lab");
          if (!label.includes("Opening Lab")) process.exit(3);
          if (lang !== "en" && label === "Made by Opening Lab") process.exit(4);
          seen.add(label);
        }
        if (seen.size !== langs.length) process.exit(5);
        const creator = MAKER_BADGE_COPY.es[MAKER_BADGE_LABEL].replaceAll("{name}", "Demo Coach");
        if (creator !== "Hecho por Demo Coach") process.exit(6);
      `,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

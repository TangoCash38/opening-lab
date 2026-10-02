import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const landing = src("src/components/opening-lab/home-intro.tsx");
const menu = src("src/components/opening-lab/landing-menu.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const css = src("src/styles.css");
const copy = src("src/lib/landing-copy.ts");

test("landing matches the signed-off home: live packs, real prices", () => {
  assert.match(landing, /data-landing/);
  assert.doesNotMatch(landing, /data-landing-cta/);
  assert.doesNotMatch(landing, /Enter the gym/);
  assert.match(landing, /LIVE_PACK_IDS/);
  assert.match(landing, /packPrice/);
  assert.match(landing, /FREE_SAMPLE_LINE_IDS/);
  assert.match(landing, /\{n\} free · \{price\}/);
  assert.match(landing, /Scotch Gambit/);
  assert.match(landing, /data-open-pack=\{pack\.id\}/);
  assert.match(landing, /data-coming-soon-chip/);
  assert.match(landing, /italian-white/);
  assert.match(landing, /ruy-white/);
  assert.match(landing, /french-white/);
  assert.match(landing, /qg-white/);
  assert.match(landing, /Study first\. Then test yourself from memory/);
  assert.doesNotMatch(landing, /Strict book-move trainer/);
  assert.match(landing, /coach-seated-v2\.png/);
  assert.match(landing, /\/brand\/opening-lab-logo\.png/);
  assert.match(landing, /landing-mug-logo/);
  assert.match(css, /\.landing-mug-logo\s*\{[^}]*left:\s*48\.125%/);
  assert.match(css, /\.landing-mug-logo\s*\{[^}]*top:\s*74\.837%/);
  assert.match(css, /\.landing-mug-logo\s*\{[^}]*width:\s*15\.5%/);
  assert.match(css, /\.landing-mug-logo\s*\{[^}]*translate\(-50%,\s*-50%\)/);
  assert.match(css, /\.landing-hero-art \{[\s\S]*gap:\s*0\.55rem/);
  assert.doesNotMatch(css, /\.landing-coach-wrap \{[\s\S]*margin-right:\s*-/);
  assert.match(landing, /className="brand-mark"/);
  assert.doesNotMatch(landing, /\/pieces\/wR\.svg/);
  assert.doesNotMatch(landing, /Learn the book\. Keep the book\./);
  assert.match(landing, /Practice with hints\. Test with none\./);
  assert.doesNotMatch(landing, /App coming soon/);
  assert.doesNotMatch(landing, /Continue on the web/);
  assert.doesNotMatch(landing, /£4\.99|£9\.99|£0\.99/);
  assert.doesNotMatch(landing, /Play on|versus the computer|vs computer/i);
  assert.doesNotMatch(landing, /human voice|recorded voice|voice actor|real person/i);
  assert.doesNotMatch(landing, /data-header-home/);
});

test("Home in the app header returns to the landing; landing links stay visible", () => {
  assert.match(shell, /data-header-home/);
  assert.match(shell, /onClick=\{goHome\}/);
  assert.match(shell, /setView\("landing"\)/);
  assert.match(shell, /showAppHeader = view !== "landing"/);
  assert.doesNotMatch(shell, /onEnterGym/);
  assert.match(shell, /onOpenPack=\{\(packId\) => goPacks\(packId\)\}/);
  assert.match(shell, /onCreateOwn=\{openCreate\}/);
  assert.match(shell, /setView\("home"\)/);
  assert.match(css, /\.header-home-btn[\s\S]*width:\s*44px/);
  assert.match(css, /\.header-home-btn[\s\S]*min-height:\s*44px/);
  assert.doesNotMatch(landing, /data-landing-packs/);
  assert.doesNotMatch(landing, /Drill packs/);
  assert.match(landing, /aria-label=\{t\("Site"\)\}/);
  assert.match(landing, /data-landing-support/);
  assert.doesNotMatch(landing, /className="landing-cta-note"/);
  assert.match(
    landing,
    /t\("Open now"\)[\s\S]{0,220}t\("Chess opening drills available now"\)/,
  );
  assert.doesNotMatch(landing, /That was Legal/);
  assert.doesNotMatch(landing, /data-free-try-buy-all/);
  assert.match(landing, /onClick=\{onSupport\}/);
  assert.match(landing, /onOpenPack\(pack\.id\)/);
  assert.match(landing, /data-coming-soon-feedback/);
  assert.match(landing, /Please leave feedback for openings you’d like to see/);
  assert.match(landing, /mailto:support@openinglab\.co\.uk\?subject=Opening%20Lab%20feedback/);
  assert.doesNotMatch(css, /\.landing-nav\s*\{[^}]*display:\s*none/);
  assert.match(menu, /data-landing-menu/);
  assert.match(menu, /t\("Menu"\)/);
  assert.match(menu, /data-menu-create/);
  assert.match(menu, /t\("Create your own"\)/);
  assert.match(menu, /data-menu-account/);
  assert.match(menu, /data-menu-language/);
  assert.match(menu, /data-menu-theme/);
  assert.match(menu, /search=\{\{ forgot: undefined \}\}/);
  assert.match(menu, /to="\/terms"/);
  assert.match(menu, /to="\/privacy"/);
  assert.match(menu, /onClick=\{openLegalDocument\}/);
  assert.doesNotMatch(menu, /history\.back\(/);
  assert.doesNotMatch(menu, /data-menu-terms[\s\S]{0,160}setOpen\(false\)/);
  assert.doesNotMatch(menu, /data-menu-privacy[\s\S]{0,160}setOpen\(false\)/);
  assert.match(menu, /data-menu-report/);
  assert.match(menu, /data-menu-support/);
  assert.match(menu, /t\("Support"\)/);
  assert.match(menu, /onSupport/);
  assert.match(landing, /onSupport=\{onSupport\}/);
  assert.match(menu, /LangToggle/);
  assert.doesNotMatch(menu, /Play on/);
});

test("landing copy is in every language and does not invent prices", () => {
  for (const lang of ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"]) {
    assert.match(copy, new RegExp(`${lang}:`));
  }
  assert.equal(copy.split('"Enter the gym":').length - 1, 12);
  assert.equal(copy.split('"Drill packs":').length - 1, 12);
  assert.equal(copy.split('"Opening drill packs":').length - 1, 12);
  assert.equal(copy.split('"Chess opening drills available now":').length - 1, 12);
  assert.equal(copy.split("\n    Site:").length - 1, 12);
  assert.equal(copy.split('"{n} free · {price}":').length - 1, 12);
  assert.equal(copy.split('"{price} unlocks the whole pack":').length - 1, 12);
  assert.equal(copy.split('"Whole pack · {price} — all {n} lines":').length - 1, 12);
  assert.match(landing, /Whole pack · \{price\} — all \{n\} lines/);
  assert.match(landing, /\{n\} free · \{price\} unlocks the whole pack/);
  assert.equal(copy.split('"Study first. Then test yourself from memory":').length - 1, 12);
  assert.equal(
    copy.split('"Please leave feedback for openings you’d like to see":').length - 1,
    12,
  );
  assert.doesNotMatch(copy, /Strict book-move trainer/);
  assert.doesNotMatch(copy, /£/);
  assert.doesNotMatch(copy, /Learn the book/);
});

test("landing board plays itself and the app prompt is gone", () => {
  assert.match(landing, /LandingMateDemo/);
  assert.doesNotMatch(landing, /Click the board to try free/);
  assert.doesNotMatch(landing, /data-try-free/);
  const list = src("src/components/opening-lab/pack-list.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  assert.doesNotMatch(list, /WebsiteAppPrompt/);
  assert.doesNotMatch(list, /App coming soon/);
  assert.doesNotMatch(list, /Continue on the web/);
  assert.doesNotMatch(shell, /WebsiteAppPrompt/);
  assert.doesNotMatch(shell, /App coming soon/);
  assert.match(shell, /app-header-logo/);
  assert.match(shell, /\/brand\/opening-lab-logo\.png/);
  assert.match(css, /\.landing-chip \{[\s\S]*background:\s*#111110/);
  assert.match(css, /\.landing-chip \{[\s\S]*color:\s*#ffffff/);
  assert.match(
    css,
    /html\[data-color-scheme="dark"\] \.landing-chip \{[\s\S]*background:\s*#000000/,
  );
  assert.match(
    css,
    /html\[data-color-scheme="dark"\] \.landing-chip \{[\s\S]*color:\s*#ffffff/,
  );
  assert.doesNotMatch(css, /\.landing-chip \{[\s\S]*#f4e6c8/);
});

test("only packs with playable free lines are marked green", () => {
  const catalog = src("src/lib/catalog.ts");
  const packs = src("src/data/packs.ts");
  const list = src("src/components/opening-lab/pack-list.tsx");
  assert.match(catalog, /export function packHasPlayableFreeLines/);
  assert.match(landing, /packHasPlayableFreeLines\(pack\)/);
  assert.match(landing, /data-free-lines=\{packHasPlayableFreeLines\(pack\) \? "true" : "false"\}/);
  assert.match(landing, /packHasPlayableFreeLines\(classicSamplePack\(\)\)/);
  assert.match(list, /data-free-lines=\{packHasPlayableFreeLines\(pack\) \? "true" : "false"\}/);
  assert.match(css, /\.landing-pack-card\[data-free-lines="true"\]/);
  assert.match(css, /\.pack-card\[data-free-lines="true"\]/);
  assert.match(
    css,
    /html\[data-color-scheme="dark"\] \.landing-pack-card\[data-free-lines="true"\]/,
  );
  assert.match(css, /background: #14663a/);
  assert.match(css, /color: #f4fff8/);
  const fn = catalog.slice(
    catalog.indexOf("export function packHasPlayableFreeLines"),
    catalog.indexOf("export function playableLines"),
  );
  assert.match(fn, /isWebsiteClassicSample/);
  assert.match(fn, /FREE_SAMPLE_LINE_IDS/);
  assert.doesNotMatch(fn, /isPackFree/);
  assert.doesNotMatch(fn, /PACK_OPENING/);
  for (const id of ["ckb1", "ckb3", "ckb5", "ot1", "ot2", "ot3", "ot4", "ot5", "ot6"]) {
    assert.match(packs, new RegExp(`id: "${id}"`));
  }
  assert.match(catalog, /"caro-kann-black": \["ckb1", "ckb3", "ckb5"\]/);
  assert.match(catalog, /"opening-traps": \["ot1", "ot2", "ot3", "ot4", "ot5", "ot6"\]/);
});

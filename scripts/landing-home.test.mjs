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

test("landing matches the signed-off home: gym CTA, live packs, real prices", () => {
  assert.match(landing, /data-landing/);
  assert.match(landing, /data-landing-cta/);
  assert.match(landing, /onEnterGym/);
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
  assert.match(landing, /Strict book-move trainer/);
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
  assert.match(shell, /onEnterGym=\{\(\) => goPacks\(\)\}/);
  assert.match(shell, /onOpenPack=\{\(packId\) => goPacks\(packId\)\}/);
  assert.match(shell, /onCreateOwn=\{openCreate\}/);
  assert.match(shell, /setView\("home"\)/);
  assert.match(css, /\.header-home-btn[\s\S]*width:\s*44px/);
  assert.match(css, /\.header-home-btn[\s\S]*min-height:\s*44px/);
  assert.doesNotMatch(landing, /data-landing-packs/);
  assert.doesNotMatch(landing, /Drill packs/);
  assert.match(landing, /aria-label=\{t\("Site"\)\}/);
  assert.match(landing, /data-landing-support/);
  const gymButton = landing.match(/<button[^>]*data-landing-cta[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.match(gymButton, /t\("Enter the gym"\)/);
  assert.match(gymButton, /className="landing-cta-note"[\s\S]*t\("Opening drill packs"\)/);
  assert.doesNotMatch(gymButton, /Chess opening lessons/);
  assert.match(landing, /className="landing-cta-note"/);
  assert.match(
    landing,
    /t\("Open now"\)[\s\S]{0,220}t\("Chess opening drills available now"\)/,
  );
  assert.match(landing, /onClick=\{onEnterGym\}/);
  assert.match(landing, /onClick=\{onSupport\}/);
  assert.match(landing, /onOpenPack\(pack\.id\)/);
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
  assert.match(menu, /data-menu-report/);
  assert.match(menu, /LangToggle/);
  assert.doesNotMatch(menu, /data-menu-support/);
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
  assert.doesNotMatch(copy, /£/);
  assert.doesNotMatch(copy, /Learn the book/);
});

test("landing board is an even orthographic diagram and the app prompt is gone", () => {
  assert.match(css, /grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /grid-template-rows:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.landing-board[\s\S]*transform:\s*none/);
  assert.doesNotMatch(css, /\.landing-board[\s\S]{0,400}perspective/);
  assert.doesNotMatch(css, /\.landing-board[\s\S]{0,400}skew/);
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

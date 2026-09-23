import assert from "node:assert/strict";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

const list = src("src/components/opening-lab/pack-list.tsx");
const i18n = src("src/lib/i18n.ts");
const css = src("src/styles.css");
const intro = src("src/lib/pack-intro.ts");

async function loadRankPacks() {
  const ts = require("typescript");
  const js = ts.transpileModule(src("src/lib/pack-search.ts"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-pack-search");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "pack-search.mjs");
  writeFileSync(tmp, js);
  const mod = await import(pathToFileURL(tmp).href);
  rmSync(dir, { recursive: true, force: true });
  return mod.rankPacks;
}

const rankPacks = await loadRankPacks();

function visibleCatalog() {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const ids = [...catalog.match(/VISIBLE_PACK_IDS = \[([\s\S]*?)\]/)[1].matchAll(/"([^"]+)"/g)].map(
    (match) => match[1],
  );
  const blocks = packs.split(/\n {2}\{\n/).slice(1);
  const byId = new Map();
  for (const block of blocks) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      id,
      name: block.match(/name: "([^"]+)"/)?.[1] ?? "",
      side: block.match(/side: "([^"]+)"/)?.[1] ?? "",
      section: block.match(/section: "([^"]+)"/)?.[1] ?? "",
      closedLabel: block.match(/closedLabel: "([^"]*)"/)?.[1] ?? "",
      blurb: block.match(/blurb: "([^"]*)"/)?.[1] ?? "",
    });
  }
  return ids.map((id) => {
    const pack = byId.get(id);
    assert.ok(pack, `visible pack ${id} missing from packs.ts`);
    return pack;
  });
}

const catalog = visibleCatalog();

test("home search is a cream pill that filters the pack list in place", () => {
  assert.match(list, /rankPacks/);
  assert.match(list, /pack-search-strip/);
  assert.match(list, /data-pack-search/);
  assert.match(list, /type="search"/);
  assert.match(list, /Search openings/);
  assert.match(list, /Clear search/);
  assert.match(list, /No packs match/);
  assert.doesNotMatch(list, /No openings match/);
  assert.match(list, /Escape/);
  assert.match(list, /onPointerDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(list, /matchIds/);
  assert.match(list, /leadShown/);
  assert.doesNotMatch(list, /ranked\.map/);
  assert.doesNotMatch(list, /pack-search-empty-clear/);
  assert.doesNotMatch(list, /pack-search-sticky/);
  assert.doesNotMatch(list, /role="listbox"/);

  const headingAt = list.indexOf("home-heading-row");
  const searchAt = list.indexOf("<PackSearchField", headingAt);
  const gridAt = list.indexOf("pack-list-grid", searchAt);
  assert.ok(headingAt > -1 && searchAt > headingAt && gridAt > searchAt);

  const searchCss = css.slice(css.indexOf(".pack-search-strip"), css.indexOf(".sq-light"));
  assert.match(searchCss, /\.pack-search-strip/);
  assert.match(searchCss, /position:\s*sticky/);
  assert.match(searchCss, /--pack-search-stick/);
  assert.match(searchCss, /#faf8f2/);
  assert.match(searchCss, /#f7f2e6/);
  assert.match(searchCss, /9999px/);
  assert.match(searchCss, /rgba\(92,\s*64,\s*51,\s*0\.35\)/);
  assert.match(searchCss, /max-width:\s*26rem/);
  assert.match(searchCss, /font-size:\s*0\.9375rem/);
  assert.doesNotMatch(searchCss, /--color-accent/);
  assert.doesNotMatch(searchCss, /position:\s*static/);
  assert.doesNotMatch(css, /\.pack-search-sticky/);
  assert.match(css, /\.app-shell\s*\{[^}]*overflow-x:\s*clip/);
  assert.match(css, /\.app-main\s*\{[^}]*overflow-x:\s*clip/);
  assert.match(css, /html\s*\{[^}]*overflow-x:\s*clip/);

  assert.equal(i18n.split('"Search openings":').length - 1, 12);
  assert.equal(i18n.split('"Clear search":').length - 1, 12);
  assert.equal(i18n.split('"No packs match":').length - 1, 12);
  assert.match(i18n, /"Search openings": "ابحث عن افتتاحات"/);
  assert.match(i18n, /"Search openings": "Açılış ara"/);
  assert.match(i18n, /"Clear search": "مسح البحث"/);
  assert.match(i18n, /"Clear search": "Aramayı temizle"/);
  assert.match(i18n, /"No packs match": "لا توجد حزم مطابقة"/);
  assert.match(i18n, /"No packs match": "Eşleşen paket yok"/);
  assert.doesNotMatch(i18n, /search Opening Lab/i);
  assert.doesNotMatch(i18n, /No openings match/);

  const trapsAt = list.indexOf('["opening-traps", "caro-kann-black"]');
  assert.ok(trapsAt > -1, "Opening Traps and Caro lead the catalog");
  assert.doesNotMatch(list, /Learn Drill Know/);
  assert.match(list, /onToggle=\{togglePack\}/);
});

test("required home-row English keys stay intact", () => {
  for (const key of [
    "How to play",
    "Download the app",
    "Continue on the web",
    "Tap to practice",
    "See 18 lines",
    "Free sample",
    "Guided practice · memory tests",
    "How the gym works",
    "Continue",
    "Don't show again",
    "The book move is {san}.",
    "Try again",
    "Packs are not for sale in this Play test. The three free Caro lines still train here.",
    "Free",
    "Locked",
    "{pct}%",
  ]) {
    assert.match(i18n, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), key);
  }
  assert.equal(i18n.split("£1.99").length - 1, 24);
  assert.equal(i18n.split("£2.99").length - 1, 24);
});

test("GAME_INTRO ends at informed and drops the solid-ground sentence", () => {
  assert.match(intro, /makes your early decisions more informed\./);
  assert.doesNotMatch(intro, /solid ground to take your study further/);
  assert.doesNotMatch(intro, /books, games, engines/);
  assert.match(i18n, /makes your early decisions more informed\./);
  assert.doesNotMatch(i18n, /solid ground to take your study further/);
});

test("pack search aliases and false friends against the live catalog", () => {
  const ids = (query) => rankPacks(catalog, query).map((pack) => pack.id);

  assert.deepEqual(
    ids(""),
    catalog.map((pack) => pack.id),
  );
  assert.deepEqual(
    ids("   "),
    catalog.map((pack) => pack.id),
  );

  for (const query of [
    "kid",
    "kings indian",
    "king's indian",
    "King’s Indian",
    "kings indian defence",
  ]) {
    assert.deepEqual(ids(query), ["kings-indian-black"], query);
  }
  const old = catalog.find((pack) => pack.id === "old-indian-black");
  assert.ok(old, "old-indian-black is on the visible catalog");
  assert.equal(old.name, "Old Indian Defence");
  assert.equal(old.side, "Black");
  assert.equal(old.section, "black");
  assert.match(old.closedLabel, /£1\.50/);
  const kidIndex = catalog.findIndex((pack) => pack.id === "kings-indian-black");
  const oldIndex = catalog.findIndex((pack) => pack.id === "old-indian-black");
  assert.equal(oldIndex, kidIndex + 1, "Old Indian sits next to King’s Indian in the catalog");
  assert.deepEqual(ids("old indian"), ["old-indian-black"]);
  assert.deepEqual(ids("oid"), ["old-indian-black"]);
  assert.deepEqual(ids("old indian defence"), ["old-indian-black"]);
  assert.deepEqual(ids("zzzzpack"), []);
  assert.ok(!ids("kid").includes("old-indian-black"));
  assert.ok(!ids("old indian").includes("kings-indian-black"));

  for (const query of ["caro", "caro-kann", "caro kann", "Caro-Kann"]) {
    assert.deepEqual(ids(query), ["caro-kann-black", "caro-advance-panov-white"], query);
  }
  assert.deepEqual(ids("caro black"), ["caro-kann-black"]);
  assert.deepEqual(ids("caro white"), ["caro-advance-panov-white"]);

  assert.deepEqual(ids("scotch"), ["scotch"]);
  assert.deepEqual(ids("scotch gambit"), ["scotch"]);
  assert.deepEqual(ids("nimzo"), ["nimzo-indian-black"]);
  assert.deepEqual(ids("nimzo-indian"), ["nimzo-indian-black"]);
  assert.deepEqual(ids("nimzo larsen"), ["nimzo-larsen-white"]);

  for (const query of [
    "alekhine",
    "alekhines",
    "alekhine's",
    "Alekhine’s",
    "alekhine defence",
    "alekhine defense",
  ]) {
    assert.deepEqual(ids(query), ["alekhine-black"], query);
  }

  assert.deepEqual(ids("stafford"), ["stafford-black"]);
  assert.deepEqual(ids("traps"), ["opening-traps"]);
  assert.deepEqual(ids("opening traps"), ["opening-traps"]);
  assert.deepEqual(ids("trap"), ["opening-traps"]);

  const white = ids("white");
  assert.ok(white.includes("scotch"));
  assert.ok(white.includes("caro-advance-panov-white"));
  assert.ok(!white.includes("caro-kann-black"));
  assert.ok(!white.includes("kings-indian-black"));
  assert.ok(!white.includes("opening-traps"));
  assert.equal(white.length, catalog.filter((pack) => pack.side === "White").length);

  const black = ids("black");
  assert.ok(black.includes("kings-indian-black"));
  assert.ok(black.includes("caro-kann-black"));
  assert.ok(!black.includes("scotch"));
  assert.ok(!black.includes("opening-traps"));
  assert.equal(black.length, catalog.filter((pack) => pack.side === "Black").length);

  assert.deepEqual(ids("grunfeld"), ["grunfeld-black"]);
  assert.deepEqual(ids("Grünfeld"), ["grunfeld-black"]);
  assert.deepEqual(ids("gruenfeld"), ["grunfeld-black"]);
  assert.deepEqual(ids("petrov"), ["petroff-black"]);
  assert.deepEqual(ids("qgd"), ["qgd-black"]);
  assert.deepEqual(ids("spanish"), ["ruy-white"]);
  assert.deepEqual(ids("kg"), ["kg-black"]);
  assert.deepEqual(ids("kings gambit"), ["kg-black"]);

  const indian = ids("indian");
  assert.deepEqual(indian, ["nimzo-indian-black", "kings-indian-black", "old-indian-black"]);

  assert.deepEqual(ids("legal"), []);
  assert.deepEqual(ids("e4"), []);
  assert.deepEqual(ids("nf6"), []);
  assert.deepEqual(ids("mar del plata"), []);
  assert.ok(!ids("traps").includes("stafford-black"));
  assert.ok(!ids("alekhine").includes("budapest-white"));

  const queens = ids("queens gambit");
  assert.deepEqual(queens, ["qgd-black", "queens-gambit-white"]);

  const kings = ids("kings");
  assert.deepEqual(kings[0], "kg-black");
  assert.ok(kings.includes("kings-indian-black"));
  assert.ok(kings.indexOf("kg-black") < kings.indexOf("kings-indian-black"));
});

test("client pack search has no unicode property escapes", () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx|js|mjs|jsx)$/.test(name)) files.push(path);
    }
  };
  walk(join(root, "src/components"));
  walk(join(root, "src/routes"));
  files.push(join(root, "src/lib/pack-search.ts"));
  const hits = files.filter((file) => /\\p\{|\\P\{/.test(readFileSync(file, "utf8")));
  assert.deepEqual(hits, []);
});

test("progressive prefixes o, ol, and old", () => {
  const ids = (query) => rankPacks(catalog, query).map((pack) => pack.id);

  assert.deepEqual(ids("o"), [
    "opening-traps",
    "english-white",
    "catalan-white",
    "old-indian-black",
    "ponziani-white",
  ]);
  assert.ok(ids("o").includes("opening-traps"));
  assert.ok(ids("o").includes("old-indian-black"));

  assert.deepEqual(ids("ol"), ["old-indian-black"]);
  assert.ok(!ids("ol").includes("opening-traps"));

  assert.deepEqual(ids("old"), ["old-indian-black"]);

  assert.deepEqual(ids("kid"), ["kings-indian-black"]);
  assert.ok(!ids("kid").includes("old-indian-black"));
  assert.deepEqual(ids("oid"), ["old-indian-black"]);
  assert.deepEqual(ids("old indian"), ["old-indian-black"]);
  assert.deepEqual(ids("zzzzpack"), []);
});

test("Old Indian stays distinct from King's Indian, including line text", () => {
  const kid = {
    id: "kings-indian-black",
    name: "King’s Indian Defence",
    side: "Black",
    section: "black",
    closedLabel: "Free · 18 lines",
    blurb: "Old Indian setup and KID traps",
    about: "Not the Old Indian",
    lines: [{ name: "Old Indian trap", plies: ["d4", "Nf6", "c4", "d6"] }],
  };
  const oldIndian = {
    id: "old-indian-black",
    name: "Old Indian Defence",
    side: "Black",
    section: "black",
    closedLabel: "Free · 12 lines",
  };
  const kia = {
    id: "kings-indian-attack",
    name: "King’s Indian Attack",
    side: "White",
    section: "white",
    closedLabel: "Free · 8 lines",
  };
  const packs = [kia, kid, oldIndian];
  const ids = (query) => rankPacks(packs, query).map((pack) => pack.id);

  assert.deepEqual(ids("kid"), ["kings-indian-black"]);
  assert.deepEqual(ids("kings indian"), ["kings-indian-black"]);
  assert.deepEqual(ids("king's indian"), ["kings-indian-black"]);
  assert.deepEqual(ids("old indian"), ["old-indian-black"]);
  assert.deepEqual(ids("oid"), ["old-indian-black"]);
  assert.deepEqual(ids("old indian defence"), ["old-indian-black"]);
  assert.deepEqual(ids("kia"), ["kings-indian-attack"]);
  assert.deepEqual(ids("d6"), []);
  assert.deepEqual(ids("nf6"), []);

  const live = catalog.find((pack) => pack.id === "kings-indian-black");
  assert.deepEqual(
    rankPacks([{ ...live, blurb: "mentions Old Indian", lines: kid.lines }], "old indian"),
    [],
  );
  assert.deepEqual(rankPacks([live, oldIndian], "kid"), [live]);
  assert.deepEqual(rankPacks([live, oldIndian], "oid"), [oldIndian]);
});

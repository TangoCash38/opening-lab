import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

async function loadCatalog(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const dir = join(root, "scripts", ".generated-coming-soon");
  mkdirSync(dir, { recursive: true });
  const skusJs = ts.transpileModule(src("src/lib/play-skus.ts"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  writeFileSync(join(dir, "play-skus.mjs"), skusJs);
  const js = ts
    .transpileModule(src("src/lib/catalog.ts"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replaceAll("@/lib/play-skus", "./play-skus.mjs");
  const tmp = join(dir, "catalog.mjs");
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

test("every visible pack except scotch, opening traps, and caro-kann is coming soon", async (t) => {
  const mod = await loadCatalog(t);
  if (!mod) return;
  const {
    VISIBLE_PACK_IDS,
    LIVE_PACK_IDS,
    COMING_SOON_PACK_IDS,
    isPackComingSoon,
    canPurchasePack,
    canPurchaseBuyAll,
  } = mod;

  assert.deepEqual([...LIVE_PACK_IDS], ["scotch", "opening-traps", "caro-kann-black"]);
  assert.equal(isPackComingSoon("scotch"), false);
  assert.equal(isPackComingSoon("opening-traps"), false);
  assert.equal(isPackComingSoon("caro-kann-black"), false);
  assert.equal(canPurchasePack("scotch"), true);
  assert.equal(canPurchasePack("opening-traps"), true);
  assert.equal(canPurchasePack("caro-kann-black"), true);
  assert.equal(canPurchaseBuyAll(), false);

  const live = new Set(["scotch", "opening-traps", "caro-kann-black"]);
  const gated = [];
  for (const id of VISIBLE_PACK_IDS) {
    if (live.has(id)) {
      assert.equal(isPackComingSoon(id), false, id);
      assert.equal(canPurchasePack(id), true, id);
      assert.equal(COMING_SOON_PACK_IDS.includes(id), false, id);
      continue;
    }
    assert.equal(isPackComingSoon(id), true, id);
    assert.equal(canPurchasePack(id), false, id);
    assert.equal(COMING_SOON_PACK_IDS.includes(id), true, id);
    gated.push(id);
  }
  assert.equal(gated.length, VISIBLE_PACK_IDS.length - live.size);
  assert.equal(COMING_SOON_PACK_IDS.length, gated.length);
  assert.equal(gated.includes("opening-traps"), false);
  assert.equal(gated.includes("caro-kann-black"), false);
  assert.equal(gated.includes("qgd-black"), true);
});

test("non-owner cannot open a coming-soon pack; an owner still can; scotch stays purchasable", async (t) => {
  const mod = await loadCatalog(t);
  if (!mod) return;
  const {
    isLineUnlocked,
    playableLines,
    isComingSoonClosed,
    nextUnlockedLine,
    canPurchasePack,
    canPurchaseBuyAll,
  } = mod;

  const caro = {
    id: "caro-kann-black",
    lines: ["ckb1", "ckb2", "ckb3", "ckb5", "ckb10"].map((id) => ({ id })),
  };
  const qgd = {
    id: "qgd-black",
    lines: ["qgdb1", "qgdb2"].map((id) => ({ id })),
  };
  const traps = {
    id: "opening-traps",
    lines: ["ot1", "ot2", "ot3", "ot4", "ot5", "ot6", "ot7"].map((id) => ({ id })),
  };
  const scotch = {
    id: "scotch",
    lines: ["sg1", "sg2"].map((id) => ({ id })),
  };

  assert.equal(isComingSoonClosed(qgd.id, []), true);
  assert.equal(isComingSoonClosed(qgd.id, [], true), false);
  assert.equal(isComingSoonClosed(caro.id, []), false);
  assert.equal(isComingSoonClosed(scotch.id, []), false);
  assert.equal(isComingSoonClosed(traps.id, []), false);
  assert.equal(canPurchasePack(qgd.id), false);
  assert.equal(canPurchasePack(caro.id), true);
  assert.equal(canPurchasePack(traps.id), true);
  assert.equal(canPurchaseBuyAll(), false);

  for (const line of qgd.lines) {
    assert.equal(isLineUnlocked(qgd, line.id, []), false, line.id);
  }
  assert.equal(isLineUnlocked(caro, "ckb1", []), true);
  assert.equal(isLineUnlocked(caro, "ckb3", []), true);
  assert.equal(isLineUnlocked(caro, "ckb5", []), true);
  assert.equal(isLineUnlocked(caro, "ckb2", []), false);
  assert.equal(isLineUnlocked(caro, "ckb10", []), false);
  assert.equal(isLineUnlocked(traps, "ot1", []), true);
  assert.equal(isLineUnlocked(traps, "ot6", []), true);
  assert.equal(isLineUnlocked(traps, "ot7", []), false);
  assert.deepEqual(playableLines(qgd), []);
  assert.deepEqual(
    playableLines(caro).map((line) => line.id),
    ["ckb1", "ckb3", "ckb5"],
  );
  assert.deepEqual(
    playableLines(traps).map((line) => line.id),
    ["ot1", "ot2", "ot3", "ot4", "ot5", "ot6"],
  );
  assert.equal(nextUnlockedLine(qgd, "qgdb1", []), undefined);
  assert.equal(nextUnlockedLine(caro, "ckb1", [])?.id, "ckb3");

  for (const line of qgd.lines) {
    assert.equal(isLineUnlocked(qgd, line.id, ["qgd-black"]), true, line.id);
  }
  for (const line of caro.lines) {
    assert.equal(isLineUnlocked(caro, line.id, ["caro-kann-black"]), true, line.id);
  }
  assert.equal(isLineUnlocked(traps, "ot1", ["opening-traps"]), true);
  assert.equal(isLineUnlocked(traps, "ot7", ["opening-traps"]), true);
  assert.equal(isComingSoonClosed(qgd.id, ["qgd-black"]), false);
  assert.equal(isComingSoonClosed(caro.id, ["caro-kann-black"]), false);
  assert.equal(nextUnlockedLine(caro, "ckb1", ["caro-kann-black"])?.id, "ckb2");

  assert.equal(isLineUnlocked(scotch, "sg1", []), false);
  assert.equal(isLineUnlocked(scotch, "sg1", ["scotch"]), true);
  assert.equal(canPurchasePack("scotch"), true);
});

test("home grid labels coming-soon packs and does not sell them", () => {
  const list = src("src/components/opening-lab/pack-list.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const billing = src("src/lib/play-billing.ts");
  const stripe = src("src/lib/stripe.server.ts");
  const css = src("src/styles.css");

  assert.match(list, /data-coming-soon-label/);
  assert.match(list, /data-coming-soon-note/);
  assert.match(list, /Coming soon with Professor Potato Pie\./);
  assert.match(list, /isComingSoonClosed/);
  assert.match(list, /canPurchasePack/);
  assert.match(list, /canPurchaseBuyAll\(\)/);
  assert.match(list, /if \(kind === "buy_all" && !canPurchaseBuyAll\(\)\) return;/);
  assert.match(list, /if \(kind === "pack" && \(!packId \|\| !canPurchasePack\(packId\)\)\) return;/);
  assert.match(hero, /isComingSoonClosed/);
  assert.match(hero, /onComingSoon\?\.\(pack\)/);
  assert.match(shell, /isComingSoonClosed/);
  assert.match(billing, /if \(!canPurchasePack\(packId\)/);
  assert.match(billing, /if \(!canPurchaseBuyAll\(\)\)/);
  assert.match(stripe, /if \(!canPurchaseBuyAll\(\)\)/);
  assert.match(stripe, /!canPurchasePack\(pack\.id\)/);
  assert.match(
    stripe,
    /if \(kind === "monthly" \|\| kind === "yearly"\) \{\s*\/\/ Lab\+ is not on sale in this build\.[\s\S]*return json\(\{ error: "Not on sale" \}, 400\);/,
  );
  assert.match(css, /\.pack-coming-soon-label/);
  assert.match(css, /\.pack-coming-soon-note/);
  assert.match(css, /#f3e5c8/);
  assert.doesNotMatch(list, /line-complete-burst/);
});

test("coming soon does not rewrite pack lines, prices, or titles", () => {
  const packs = src("src/data/packs.ts");
  const pricing = src("src/data/pricing.ts");
  assert.match(packs, /id: "scotch"/);
  assert.match(packs, /name: "Line 1"/);
  assert.match(packs, /name: "Line 10"/);
  assert.match(pricing, /PRICE_PACK = "£2\.99"/);
  assert.match(pricing, /PRICE_BUY_ALL = "£19\.99"/);
  assert.doesNotMatch(packs, /comingSoon:\s*true/);
});

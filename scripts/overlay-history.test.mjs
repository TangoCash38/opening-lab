import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

function makeMockWindow() {
  const listeners = new Map();
  const entries = [{ state: null }];
  let index = 0;
  const history = {
    get state() {
      return entries[index]?.state ?? null;
    },
    pushState(data, _unused, _url) {
      entries.splice(index + 1);
      entries.push({ state: data });
      index = entries.length - 1;
    },
    back() {
      if (index <= 0) return;
      index -= 1;
      const ev = { type: "popstate", state: history.state };
      for (const fn of [...(listeners.get("popstate") ?? [])]) fn(ev);
    },
  };
  return {
    history,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    _depth: () => index,
    _listenerCount: (type) => listeners.get(type)?.size ?? 0,
  };
}

async function loadMod() {
  const ts = require("typescript");
  const raw = src("src/lib/overlay-history.ts");
  const js = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-overlay-history");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `overlay-history-${Date.now()}-${Math.random()}.mjs`);
  writeFileSync(tmp, js);
  const mod = await import(pathToFileURL(tmp).href);
  return { mod, dir };
}

test("bindOverlayHistory: open pushes; popstate closes; dismiss backs without double-close", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }
  void ts;

  const { mod, dir } = await loadMod();
  try {
    const {
      bindOverlayHistory,
      OVERLAY_HISTORY_KEY,
      resetOverlayHistoryStackForTests,
    } = mod;
    resetOverlayHistoryStackForTests();

    const win = makeMockWindow();
    let closed = 0;
    const binding = bindOverlayHistory(win, {
      id: "lang",
      onPop: () => {
        closed += 1;
      },
    });

    assert.equal(win._depth(), 1);
    assert.equal(win.history.state?.[OVERLAY_HISTORY_KEY], "lang");
    assert.equal(win._listenerCount("popstate"), 1);
    assert.equal(binding.isActive(), true);

    // Hardware / gesture Back
    win.history.back();
    assert.equal(closed, 1);
    assert.equal(win._depth(), 0);
    assert.equal(binding.isActive(), false);
    assert.equal(win._listenerCount("popstate"), 0);

    binding.release();
    assert.equal(closed, 1);
    assert.equal(win._depth(), 0);

    resetOverlayHistoryStackForTests();

    // UI dismiss path: dismiss() backs without calling onPop
    const win2 = makeMockWindow();
    let closed2 = 0;
    const b2 = bindOverlayHistory(win2, {
      id: "lang",
      onPop: () => {
        closed2 += 1;
      },
    });
    assert.equal(win2._depth(), 1);
    b2.dismiss();
    assert.equal(win2._depth(), 0);
    assert.equal(closed2, 0, "dismiss suppresses synthetic popstate close");
    assert.equal(b2.isActive(), false);
    assert.equal(win2._listenerCount("popstate"), 0);

    resetOverlayHistoryStackForTests();

    // release() while still active also backs (React open→false cleanup)
    const win3 = makeMockWindow();
    let closed3 = 0;
    const b3 = bindOverlayHistory(win3, {
      id: "line-result",
      onPop: () => {
        closed3 += 1;
      },
    });
    b3.release();
    assert.equal(win3._depth(), 0);
    assert.equal(closed3, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("nested overlays: Back closes top only; second Back closes base", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }
  void ts;

  const { mod, dir } = await loadMod();
  try {
    const { bindOverlayHistory, resetOverlayHistoryStackForTests } = mod;
    resetOverlayHistoryStackForTests();

    const win = makeMockWindow();
    const log = [];
    const base = bindOverlayHistory(win, {
      id: "line-result",
      onPop: () => log.push("line-result"),
    });
    const nested = bindOverlayHistory(win, {
      id: "play-on-prompt",
      onPop: () => log.push("play-on-prompt"),
    });

    assert.equal(win._depth(), 2);
    assert.equal(win._listenerCount("popstate"), 1, "single shared listener");

    win.history.back();
    assert.deepEqual(log, ["play-on-prompt"]);
    assert.equal(nested.isActive(), false);
    assert.equal(base.isActive(), true);
    assert.equal(win._depth(), 1);

    win.history.back();
    assert.deepEqual(log, ["play-on-prompt", "line-result"]);
    assert.equal(base.isActive(), false);
    assert.equal(win._depth(), 0);
    assert.equal(win._listenerCount("popstate"), 0);

    // UI teardown of nested then base (modal unmount while prompt open)
    resetOverlayHistoryStackForTests();
    const win2 = makeMockWindow();
    const log2 = [];
    const base2 = bindOverlayHistory(win2, {
      id: "line-result",
      onPop: () => log2.push("line-result"),
    });
    const nested2 = bindOverlayHistory(win2, {
      id: "play-on-prompt",
      onPop: () => log2.push("play-on-prompt"),
    });
    nested2.release();
    base2.release();
    assert.equal(win2._depth(), 0);
    assert.deepEqual(log2, [], "UI release must not fire onPop");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("language sheet, finish modal, and promo use useOverlayHistory", () => {
  const picker = src("src/components/opening-lab/lang-picker.tsx");
  const modal = src("src/components/opening-lab/line-result-modal.tsx");
  const train = src("src/components/opening-lab/train-view.tsx");
  const hook = src("src/hooks/use-overlay-history.ts");

  assert.match(hook, /bindOverlayHistory/);
  assert.match(hook, /binding\.release/);

  assert.match(picker, /useOverlayHistory\(open, close, "lang"\)/);
  assert.match(modal, /useOverlayHistory\(true, onClose, "line-result"\)/);
  assert.match(
    modal,
    /useOverlayHistory\(playOnPrompt, \(\) => setPlayOnPrompt\(false\), "play-on-prompt"\)/,
  );
  assert.match(train, /useOverlayHistory\(/);
  assert.match(train, /Boolean\(pendingPromo\)/);
  assert.match(train, /"promo"/);
});

test("lang-picker still has Escape + Back/X and no native select", () => {
  const picker = src("src/components/opening-lab/lang-picker.tsx");
  assert.doesNotMatch(picker, /<select/);
  assert.match(picker, /Escape/);
  assert.match(picker, /lang-picker-back/);
  assert.match(picker, /useOverlayHistory/);
});

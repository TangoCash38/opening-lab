import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const menu = src("src/components/opening-lab/home-menu.tsx");
const intro = src("src/components/opening-lab/home-intro.tsx");
const report = src("src/components/opening-lab/report-line.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const guide = src("src/components/opening-lab/guide-view.tsx");
const seen = src("src/lib/home-intro.ts");
const i18n = src("src/lib/i18n.ts");
const css = src("src/styles.css");
const hero = src("src/components/opening-lab/home-hero.tsx");
const train = src("src/components/opening-lab/train-view.tsx");

test("Menu replaces Find the mate on the phone home heading", () => {
  assert.doesNotMatch(list, /Learn Drill Know/);
  assert.doesNotMatch(list, /QuietLabel/);
  assert.doesNotMatch(list, />White</);
  assert.doesNotMatch(list, />Black</);
  assert.match(list, /<HomeMenu/);
  assert.match(menu, /data-home-menu/);
  assert.match(menu, /data-home-menu-sheet/);
  assert.match(menu, /data-menu-create/);
  assert.match(menu, /data-menu-help/);
  assert.match(menu, /data-menu-report/);
  assert.match(menu, /t\("Create your own"\)/);
  assert.match(menu, /t\("Help"\)/);
  assert.match(menu, /t\("Report incorrect line"\)/);
  assert.match(menu, /text-align: start|text-start|className="home-menu-item"/);
  assert.doesNotMatch(menu, /Find the mate/);
  assert.doesNotMatch(menu, /More games/);
  assert.doesNotMatch(list, /Find the mate/);
  assert.doesNotMatch(list, /More games/);
  assert.doesNotMatch(hero, /Find the mate/);
  assert.doesNotMatch(hero, /MoreGamesMenu/);
  assert.doesNotMatch(shell, /FindMate/);
  assert.doesNotMatch(shell, /onOpenMate/);
  assert.match(css, /\.home-menu-panel/);
  assert.match(css, /text-align:\s*start/);
  assert.match(shell, /onCreateOwn=\{\(\) =>/);
  assert.match(shell, /setView\("create"\)/);
});

test("Menu includes Feedback mail to support", () => {
  assert.match(menu, /data-menu-feedback/);
  assert.match(menu, /t\("Feedback"\)/);
  assert.match(menu, /mailto:support@openinglab\.co\.uk/);
  assert.match(menu, /Opening%20Lab%20feedback/);
  assert.equal(i18n.split("\n  Feedback:").length - 1, 12, "Feedback");
});

test("first-run intro is brand + hobbyist, then full-bleed poster Start", () => {
  assert.match(seen, /opening-lab:home-intro:v2/);
  assert.match(seen, /localStorage/);
  assert.match(seen, /export function hasSeenHomeIntro/);
  assert.match(seen, /export function markHomeIntroSeen/);
  assert.match(intro, /data-home-intro/);
  assert.match(intro, /data-home-intro-page/);
  assert.match(intro, /data-home-intro-phase/);
  assert.match(intro, /scrollTo\(\{ top: 0/);
  assert.match(intro, /Opening Lab/);
  assert.match(intro, /Guided practice · memory tests/);
  assert.match(intro, /data-intro="brand"/);
  assert.match(intro, /data-intro="splash"/);
  assert.doesNotMatch(intro, /data-intro="welcome"/);
  assert.doesNotMatch(intro, /WelcomeBanner/);
  assert.doesNotMatch(intro, /WELCOME_MS/);
  assert.doesNotMatch(intro, /home-intro-horse/);
  assert.match(intro, /learn-drill-splash\.webp/);
  assert.match(intro, /home-intro-start/);
  assert.match(intro, /t\("Start"\)/);
  assert.match(intro, /t\("Continue"\)/);
  assert.match(intro, /SplashPage onStart=\{onContinue\}/);
  assert.match(
    intro,
    /developed by a hobbyist with a strong technical curiosity\. Please report any inaccuracy to support@openinglab\.co\.uk/,
  );
  assert.doesNotMatch(intro, /learn-with-help\.webp/);
  assert.doesNotMatch(intro, /opening-drill\.webp/);
  assert.doesNotMatch(intro, /learn-drill\.webp/);
  assert.doesNotMatch(intro, /OPENING DRILL/);
  assert.doesNotMatch(intro, /Practise\. Remember\. Recognise\./);
  assert.doesNotMatch(intro, /First, learn the line/);
  assert.doesNotMatch(intro, /Choose a pack/);
  assert.doesNotMatch(intro, /home-intro-dots/);
  assert.doesNotMatch(intro, /Learn openings through practice and recall/);
  assert.doesNotMatch(intro, /Start training/);
  assert.match(shell, /Guided practice · memory tests/);
  assert.match(shell, /hasSeenHomeIntro/);
  assert.match(shell, /markHomeIntroSeen/);
  assert.match(shell, /view === "intro"/);
  assert.match(shell, /useLayoutEffect/);
  assert.match(shell, /playIntroFinished/);
  assert.match(shell, /if \(isPlayWrap\(\)\) playIntroFinished = true/);
  assert.match(shell, /if \(play\) \{\s*if \(playIntroFinished\) setView\("home"\);\s*return;\s*\}/);
  assert.doesNotMatch(shell, /sessionStorage\.(get|set)Item/);
  assert.doesNotMatch(shell, /AppSplash/);
  assert.doesNotMatch(shell, /hasSeenAppSplash/);
  assert.doesNotMatch(shell, /opening-lab:splash:v4/);
  assert.doesNotMatch(shell, /showSplash/);
  assert.match(guide, /Read the trainer intro/);
  assert.match(guide, /onShowIntro/);
  assert.match(guide, /guide-intro-copy/);
  assert.match(guide, /guide-intro-reopen/);
  assert.doesNotMatch(intro, /Play on/);
  assert.doesNotMatch(intro, /versus the computer/);
  assert.doesNotMatch(guide, /Play on/);
  assert.doesNotMatch(list, /There is no Play on/);
  assert.equal(i18n.split('"Welcome to Opening Lab":').length - 1, 12);
  assert.equal(i18n.split("\n  Skip:").length - 1, 12, "Skip");
  assert.match(css, /\.home-intro-splash/);
  assert.match(css, /\.home-intro-start/);
  assert.match(css, /\.home-intro-hobbyist/);
  assert.match(css, /\.home-intro-splash-art img[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.guide-intro-reopen[\s\S]*display:\s*flex/);
  assert.doesNotMatch(css, /\.home-intro-welcome-banner/);
  assert.doesNotMatch(css, /home-intro-horse-trot/);
  assert.doesNotMatch(intro, /t\("Play"\)/);
});

test("report incorrect line is a support promise, not an automatic store refund", () => {
  assert.match(report, /data-report-line/);
  assert.match(report, /Thanks for spotting it/);
  assert.match(report, /We'll check it, fix the line, and refund you/);
  assert.match(report, /not an automatic store refund/);
  assert.match(report, /mailto:support@openinglab\.co\.uk/);
  assert.doesNotMatch(report, /BillingClient/);
  assert.doesNotMatch(report, /purchases\.refund/);
  assert.doesNotMatch(report, /automatic Play/);
  assert.match(shell, /ReportLineView/);
  assert.match(shell, /setView\("report"\)/);
});

test("Opening Traps and Caro lead, with real complete % and access borders", () => {
  const lead = list.indexOf('["opening-traps", "caro-kann-black"]');
  const black = list.indexOf(
    'p.section === "black" && p.id !== "vs-london" && p.id !== "caro-kann-black"',
  );
  assert.ok(lead > -1 && black > lead, "Caro is pulled out of the black section into the lead pair");
  assert.match(list, /data-pack-progress/);
  assert.match(list, /data-pack-access=\{anyOpen \? "open" : "locked"\}/);
  assert.match(list, /data-pack-fold/);
  assert.match(list, /packCompletePercent/);
  assert.doesNotMatch(list, /PlayStoreNotice/);
  assert.doesNotMatch(list, /data-locked=/);
  assert.match(css, /\.pack-progress-fill[\s\S]*--color-success/);
  assert.match(css, /\.pack-card\[data-pack-access="open"\][\s\S]*--color-success/);
  assert.match(css, /\.pack-card\[data-pack-access="locked"\][\s\S]*--color-danger/);
  assert.match(css, /\.pack-fold-locked/);
  assert.match(list, /linesInitiallyOpen/);
  assert.match(list, /FREE_SAMPLE_LINE_IDS/);
  assert.doesNotMatch(list, /setFeaturedId/);
  assert.doesNotMatch(hero, /Play on/);
  assert.doesNotMatch(train, /Play on/);
  assert.doesNotMatch(list, /Lab\+/);
  assert.equal(i18n.split("\n  Menu:").length - 1, 12, "Menu");
  for (const key of [
    "Report incorrect line",
    "Thanks for spotting it.",
    "Learn openings through practice and recall.",
    "Start training",
    "Practise. Remember. Recognise.",
    "Choose a pack",
    "Guided practice · memory tests",
    "Read the trainer intro",
    "Skip",
  ]) {
    assert.equal(
      i18n.split(key === "Skip" ? "\n  Skip:" : `"${key}":`).length - 1,
      12,
      key,
    );
  }
});

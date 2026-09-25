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
  assert.match(shell, /const openCreate = \(\) =>/);
  assert.match(shell, /setView\("create"\)/);
});

test("Menu opens the in-app Feedback form", () => {
  assert.match(menu, /data-menu-feedback/);
  assert.match(menu, /t\("Feedback"\)/);
  assert.match(menu, /onClick=\{\(\) => pick\(onFeedback\)\}/);
  assert.doesNotMatch(menu, /mailto:support@openinglab\.co\.uk/);
  assert.equal(i18n.split("\n  Feedback:").length - 1, 12, "Feedback");
});

test("cold open is the branded landing, not a second splash", () => {
  assert.doesNotMatch(shell, /opening-lab:home-intro/);
  assert.doesNotMatch(shell, /hasSeenHomeIntro/);
  assert.doesNotMatch(shell, /markHomeIntroSeen/);
  assert.doesNotMatch(shell, /from "@\/lib\/home-intro"/);
  assert.doesNotMatch(intro, /opening-lab:home-intro/);
  assert.doesNotMatch(intro, /data-intro="welcome"/);
  assert.doesNotMatch(intro, /data-intro="splash"/);
  assert.doesNotMatch(intro, /WelcomeBanner/);
  assert.doesNotMatch(intro, /learn-drill-splash\.webp/);
  assert.doesNotMatch(intro, /home-intro-start/);
  assert.doesNotMatch(intro, /home-intro-horse/);
  assert.match(intro, /data-landing/);
  assert.doesNotMatch(intro, /Learn the book\. Keep the book\./);
  assert.match(intro, /Practice with hints\. Test with none\./);
  assert.match(intro, /Enter the gym/);
  assert.match(intro, /Strict book-move trainer/);
  assert.match(intro, /coach-seated-v2\.png/);
  assert.match(shell, /LandingHome/);
  assert.match(shell, /useState<View>\("landing"\)/);
  assert.match(shell, /setView\("landing"\)/);
  assert.match(shell, /data-header-home/);
  assert.match(shell, /view !== "landing"/);
  assert.match(shell, /Guided practice · memory tests/);
  assert.doesNotMatch(shell, /introFinished/);
  assert.doesNotMatch(shell, /view === "intro"/);
  assert.match(shell, /useLayoutEffect/);
  assert.match(shell, /onShowIntro/);
  assert.doesNotMatch(shell, /sessionStorage\.(get|set)Item/);
  assert.doesNotMatch(shell, /localStorage\.(get|set)Item/);
  assert.doesNotMatch(shell, /AppSplash/);
  assert.doesNotMatch(shell, /hasSeenAppSplash/);
  assert.doesNotMatch(shell, /opening-lab:splash:v4/);
  assert.doesNotMatch(shell, /showSplash/);
  assert.match(guide, /Read the trainer intro/);
  assert.match(guide, /onShowIntro/);
  assert.match(guide, /guide-intro-copy/);
  assert.match(guide, /guide-intro-reopen/);
  assert.match(
    guide,
    /developed by a hobbyist with a strong technical curiosity\. Please report any inaccuracy to support@openinglab\.co\.uk/,
  );
  assert.doesNotMatch(intro, /Play on/);
  assert.doesNotMatch(intro, /versus the computer/);
  assert.doesNotMatch(intro, /human voice|recorded voice|voice actor/i);
  assert.doesNotMatch(guide, /Play on/);
  assert.doesNotMatch(list, /There is no Play on/);
  assert.equal(i18n.split('"Welcome to Opening Lab":').length - 1, 12);
  assert.equal(i18n.split("\n  Skip:").length - 1, 12, "Skip");
  assert.match(css, /\.landing-page/);
  assert.match(css, /\.header-home-btn[\s\S]*min-width:\s*44px/);
  assert.match(css, /\.guide-intro-reopen[\s\S]*display:\s*flex/);
  assert.doesNotMatch(css, /\.home-intro-splash/);
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
  assert.match(list, /data-pack-access=\{comingSoonClosed \? "coming-soon" : anyOpen \? "open" : "locked"\}/);
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

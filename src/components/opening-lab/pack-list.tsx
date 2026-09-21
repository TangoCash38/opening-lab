import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { packPrice } from "@/data/pricing";
import {
  catalogOffersLabPlus,
  FREE_SAMPLE_LINE_IDS,
  hasPaidPlaySkuPath,
  visiblePacks,
} from "@/lib/catalog";
import { packShortLabel } from "@/lib/featured-pack";
import { packLooksFree } from "@/lib/review-free";
import { packMatchesQuery } from "@/lib/pack-search";
import { useProgress } from "@/hooks/use-progress";
import { useUnlocks } from "@/hooks/use-unlocks";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  clearPendingCheckout,
  confirmCheckoutSession,
  fetchPaymentsEnabled,
  readPendingCheckout,
  savePendingCheckout,
  startCheckout,
  type CheckoutKind,
} from "@/lib/checkout";
import { isPlayWrap } from "@/lib/play-app";
import { LONDON_PACK_ID, type TrainStartOptions } from "@/lib/london-warmup";
import {
  hasPlayBillingBridge,
  restorePlayPacks,
  startPlayBuyAll,
  startPlayPackBuy,
} from "@/lib/play-billing";
import { PackExpandHint } from "./pack-lines";
import { LondonWarmupChip } from "./london-warmup-chip";
import { MiniBoard } from "./mini-board";
import { UnlockModal } from "./unlock-modal";
import { SubscribeModal } from "./subscribe-modal";
import { PlayStoreNotice } from "./play-store-notice";
import { HomeHero } from "./home-hero";
import { HomeMenu } from "./home-menu";
import { LegalFooter } from "./legal-footer";
import { useT } from "@/lib/i18n";
import { WebsiteAppPrompt } from "./website-app-prompt";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (
    pack: Pack,
    line: OpeningLine,
    mode?: TrainMode,
    options?: TrainStartOptions,
  ) => void;
  onHowToPlay: () => void;
  onCreateOwn?: () => void;
  onReportLine: () => void;
};

const LEAD_PACK_IDS = ["opening-traps", "caro-kann-black"] as const;

function packTrainPercent(
  pack: Pack,
  isComplete: (lineId: string) => boolean,
  testPercentOf: (lineId: string, bookLen: number) => number | null,
): number {
  if (pack.lines.length === 0) return 0;
  let sum = 0;
  for (const line of pack.lines) {
    if (isComplete(line.id)) sum += 100;
    else sum += testPercentOf(line.id, line.plies.length) ?? 0;
  }
  return Math.round(sum / pack.lines.length);
}

function PackProgress({ locked, percent }: { locked: boolean; percent: number }) {
  const t = useT();
  return (
    <div
      className="pack-progress"
      data-pack-progress
      data-locked={locked ? "true" : "false"}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={locked ? 0 : percent}
      aria-label={locked ? t("Locked") : t("{pct}%", { pct: percent })}
    >
      <div className="pack-progress-track">
        <div
          className="pack-progress-fill"
          style={{ width: locked ? "100%" : `${percent}%` }}
        />
      </div>
      <span className="pack-progress-label">
        {locked ? t("Locked") : t("{pct}%", { pct: percent })}
      </span>
    </div>
  );
}

type ModalTarget = { pack: Pack; price: string };

function QuietLabel({ children }: { children: string }) {
  return (
    <p className="pack-list-full mb-2 mt-5 px-1 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-fg-subtle">
      {children}
    </p>
  );
}

function PackSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useT();
  return (
    <div className="pack-list-full pack-search">
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("Search openings")}
          aria-label={t("Search openings")}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          className="pack-search-input w-full min-h-11 rounded-full border border-border bg-bg-elevated px-4 py-3 pe-11 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-subtle focus:ring-2"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-y-0 end-1 my-auto grid size-9 place-items-center rounded-full text-fg-muted"
            aria-label={t("Clear search")}
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PackCard({
  pack,
  unlocked,
  open,
  onToggle,
  onRequestUnlock,
  onStartLine,
  playApp,
}: {
  pack: Pack;
  unlocked: boolean;
  open: boolean;
  onToggle: (pack: Pack) => void;
  onRequestUnlock: (pack: Pack) => void;
  onStartLine: Props["onStartLine"];
  playApp: boolean;
}) {
  const t = useT();
  const { isComplete, testPercentOf } = useProgress();
  const free = packLooksFree(pack);
  const price = packPrice(pack);
  const locked = !unlocked;
  const hasFreeLines = (FREE_SAMPLE_LINE_IDS[pack.id]?.length ?? 0) > 0;
  const barLocked = locked && !hasFreeLines;
  const percent = packTrainPercent(pack, isComplete, testPercentOf);
  const shortPack = packShortLabel(pack);

  const sideClass =
    pack.side === "White"
      ? "bg-tag-white-bg text-tag-white-fg"
      : pack.side === "Black"
        ? "bg-tag-black-bg text-tag-black-fg"
        : "bg-gold-soft text-gold";

  return (
    <div
      className={`pack-card mb-3.5 overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] bg-bg-elevated shadow-[var(--shadow-card)] ${
        open ? "pack-list-full " : ""
      }${locked ? "border-border/80" : "border-border"}`}
      data-pack-card={pack.id}
      data-pack-open={open ? "true" : "false"}
    >
      <button
        type="button"
        className="flex w-full flex-col px-4 pb-3 pt-3.5 text-start"
        onClick={() => onToggle(pack)}
        aria-expanded={open}
      >
        <div className="grid w-full grid-cols-[auto_1fr] items-center gap-3.5">
          <div className="relative">
            <MiniBoard />
            {locked && (
              <span
                className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-fg text-bg-elevated shadow-sm"
                aria-hidden
              >
                <Lock className="size-3.5" strokeWidth={2.5} />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[0.95rem] font-bold">{pack.name}</div>
              {locked && (
                <Lock
                  className="size-3.5 shrink-0 text-fg-subtle"
                  strokeWidth={2.5}
                  aria-label="Locked"
                />
              )}
            </div>
            <div className="mt-0.5 text-xs text-fg-subtle">{pack.blurb}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[0.65rem] font-semibold text-accent">
                {t("{n} lines", { n: pack.lines.length })}
              </span>
              {free ? (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.65rem] font-semibold text-success">
                  {(FREE_SAMPLE_LINE_IDS[pack.id]?.length ?? 0) > 0
                    ? t("{n} free", { n: FREE_SAMPLE_LINE_IDS[pack.id].length })
                    : t("Free")}
                </span>
              ) : unlocked ? (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.65rem] font-semibold text-success">
                  {t("Unlocked")}
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.65rem] font-semibold text-fg-muted">
                    {t("Pay as you go")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-fg px-2 py-0.5 text-[0.65rem] font-semibold text-bg-elevated">
                    <Lock className="size-3" strokeWidth={2.5} aria-hidden />
                    {price}
                  </span>
                </>
              )}
              <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.65rem] font-semibold text-fg-muted">
                {pack.eco}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${sideClass}`}
              >
                {pack.side}
              </span>
              {pack.badge ? (
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[0.65rem] font-semibold text-gold">
                  {pack.badge}
                </span>
              ) : pack.section === "special" ? (
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[0.65rem] font-semibold text-gold">
                  {t("New")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <PackProgress locked={barLocked} percent={percent} />
        <PackExpandHint
          open={open}
          free={free}
          closedLabel={
            price
              ? t("{price} · See {n} {pack} lines", {
                  price,
                  n: pack.lines.length,
                  pack: shortPack,
                })
              : t("Tap to see {n} {pack} lines", {
                  n: pack.lines.length,
                  pack: shortPack,
                })
          }
        />
      </button>

      {open ? (
        <div className="border-t border-border px-2 pb-3 pt-2">
          <HomeHero
            pack={pack}
            playApp={playApp}
            embedded
            linesInitiallyOpen
            onStartLine={onStartLine}
            onRequestUnlock={onRequestUnlock}
          />
        </div>
      ) : null}

      {pack.id === LONDON_PACK_ID && !open ? (
        <div className="pack-card-warmup">
          <LondonWarmupChip pack={pack} onStartLine={onStartLine} />
        </div>
      ) : null}

      {locked && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <button
            type="button"
            onClick={() => onRequestUnlock(pack)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-subtle py-2.5 text-[0.82rem] font-semibold text-fg-muted active:scale-[0.99]"
          >
            <Lock className="size-3.5" strokeWidth={2.5} />
            {t("Pay as you go · {price}", { price: price ?? "" })}
          </button>
        </div>
      )}
    </div>
  );
}

export function PackList({
  onStartLine,
  onHowToPlay,
  onCreateOwn,
  onReportLine,
}: Props) {
  const t = useT();
  const { canAccess, buyPack, subscribe, buyAll, paymentsEnabled } = useUnlocks();
  const { user, isPending } = useCurrentUserState();
  const signedIn = !!user && !user.isDevFallback;
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const [playApp, setPlayApp] = useState(() => isPlayWrap());
  const [packQuery, setPackQuery] = useState("");
  const [openPackId, setOpenPackId] = useState<string | null>(null);
  const resumedCheckout = useRef(false);
  const wrap = playApp || isPlayWrap();

  useEffect(() => {
    setPlayApp(isPlayWrap());
  }, []);

  const catalog = visiblePacks(PACKS);
  const q = packQuery.trim();
  const searching = q.length > 0;
  const inMoreList = (p: Pack) => !searching || packMatchesQuery(p, q);
  const isLead = (p: Pack) =>
    (LEAD_PACK_IDS as readonly string[]).includes(p.id);
  const lead = LEAD_PACK_IDS.map((id) => catalog.find((p) => p.id === id)).filter(
    (p): p is Pack => !!p && inMoreList(p),
  );
  const white = catalog.filter(
    (p) => p.section === "white" && !isLead(p) && inMoreList(p),
  );
  const black = catalog.filter(
    (p) => p.section === "black" && p.id !== "vs-london" && p.id !== "caro-kann-black" && inMoreList(p),
  );
  const classicGames = catalog.find(
    (p) => p.id === "classic-games" && !isLead(p) && inMoreList(p),
  );
  const vsLondon = catalog.find(
    (p) => p.id === "vs-london" && !isLead(p) && inMoreList(p),
  );
  const clubWeapons = catalog.find(
    (p) => p.id === "club-weapons" && !isLead(p) && inMoreList(p),
  );
  const morePacks = catalog.length > 0;
  const moreMatches =
    lead.length > 0 ||
    !!classicGames ||
    !!vsLondon ||
    !!clubWeapons ||
    white.length > 0 ||
    black.length > 0;
  const showNoMatches = searching && !moreMatches;

  const togglePack = (pack: Pack) => {
    setOpenPackId((id) => (id === pack.id ? null : pack.id));
  };

  const offerPlayLabPlus = catalogOffersLabPlus(catalog);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await confirmCheckoutSession(sessionId);
        if (cancelled) return;
        if (!result.ok) {
          setUnlockNotice(t("Payment not confirmed yet"));
          return;
        }
        if (result.kind === "pack" && result.packId) {
          buyPack(result.packId);
        } else if (result.kind === "buy_all" || result.plan === "buy_all") {
          buyAll();
        } else if (result.kind === "monthly" || result.kind === "yearly") {
          subscribe(result.kind);
        } else if (result.plan === "monthly" || result.plan === "yearly") {
          subscribe(result.plan);
        }
        setUnlockNotice(t("Unlocked"));
      } catch {
        if (!cancelled) setUnlockNotice(t("Could not confirm payment"));
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("paid");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buyPack, buyAll, subscribe]);

  const requestUnlock = (pack: Pack) => {
    const price = packPrice(pack);
    if (!price) return;
    setPayError(null);
    setModal({ pack, price });
  };

  const goToSignIn = (kind: CheckoutKind, packId?: string) => {
    savePendingCheckout({ kind, packId });
    window.location.href = "/login?next=checkout";
  };

  const playRestore = async () => {
    setPayError(null);
    setPayBusy(true);
    try {
      if (isPending) {
        setPayError("Please wait…");
        return;
      }
      if (!signedIn) {
        goToSignIn("buy_all");
        return;
      }
      if (!hasPlayBillingBridge()) {
        setPayError("This app build cannot open Google Play Billing yet.");
        return;
      }
      await restorePlayPacks();
      setModal(null);
      setShowSub(false);
      setUnlockNotice(t("Unlocked"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not restore purchases";
      if (message === "Sign in required") {
        goToSignIn("buy_all");
        return;
      }
      setPayError(message);
    } finally {
      setPayBusy(false);
    }
  };

  const pay = async (kind: CheckoutKind, packId?: string) => {
    if (playApp || isPlayWrap()) {
      if (kind === "monthly" || kind === "yearly") {
        setShowSub(false);
        setPayBusy(false);
        return;
      }
      setPayError(null);
      setPayBusy(true);
      try {
        if (isPending) {
          setPayError("Please wait…");
          return;
        }
        if (!signedIn) {
          goToSignIn(kind, packId);
          return;
        }
        if (!hasPlayBillingBridge()) {
          setPayError("This app build cannot open Google Play Billing yet.");
          return;
        }
        if (kind === "pack") {
          if (!packId || !hasPaidPlaySkuPath({ id: packId, isFree: false })) {
            setPayError("This pack isn’t on sale in the store yet");
            return;
          }
          const unlocks = await startPlayPackBuy(packId);
          if (!unlocks) return;
        } else if (kind === "buy_all") {
          const unlocks = await startPlayBuyAll();
          if (!unlocks) return;
        } else {
          return;
        }
        setModal(null);
        setShowSub(false);
        setUnlockNotice(t("Unlocked"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment failed";
        if (message === "Sign in required") {
          goToSignIn(kind, packId);
          return;
        }
        setPayError(message);
      } finally {
        setPayBusy(false);
      }
      return;
    }
    setPayError(null);
    setPayBusy(true);
    try {
      const live =
        paymentsEnabled === true
          ? true
          : paymentsEnabled === false
            ? false
            : await fetchPaymentsEnabled();
      if (live) {
        if (isPending) {
          setPayError("Please wait…");
          return;
        }
        if (!signedIn) {
          goToSignIn(kind, packId);
          return;
        }
        const url = await startCheckout(kind, packId);
        window.location.href = url;
        return;
      }
      if (kind === "pack" && packId) buyPack(packId);
      else if (kind === "buy_all") buyAll();
      else if (kind === "monthly" || kind === "yearly") subscribe(kind);
      setModal(null);
      setShowSub(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      if (message === "Sign in required") {
        goToSignIn(kind, packId);
        return;
      }
      setPayError(message);
    } finally {
      setPayBusy(false);
    }
  };

  useEffect(() => {
    if (resumedCheckout.current) return;
    if (playApp || isPlayWrap()) {
      if (isPending || !signedIn) return;
      const pending = readPendingCheckout();
      if (!pending || (pending.kind !== "pack" && pending.kind !== "buy_all")) return;
      resumedCheckout.current = true;
      clearPendingCheckout();
      void pay(pending.kind, pending.packId);
      return;
    }
    if (isPending || !signedIn || paymentsEnabled !== true) return;
    if (new URLSearchParams(window.location.search).get("paid") === "1") return;
    const pending = readPendingCheckout();
    if (!pending) return;
    resumedCheckout.current = true;
    clearPendingCheckout();
    void pay(pending.kind, pending.packId);
  }, [isPending, signedIn, paymentsEnabled, playApp]);

  const renderCard = (pack: Pack) => (
    <PackCard
      key={pack.id}
      pack={pack}
      unlocked={canAccess(pack)}
      open={openPackId === pack.id}
      onToggle={togglePack}
      onRequestUnlock={requestUnlock}
      onStartLine={onStartLine}
      playApp={wrap}
    />
  );

  return (
    <div className="pack-list">
      <WebsiteAppPrompt />
      <div className="home-heading-row">
        <h1 className="font-display text-[1.45rem] font-bold tracking-tight sm:text-[1.65rem]">
          {t("Your opening training packs")}
        </h1>
        <div className="home-heading-actions">
          <HomeMenu
            onCreateOwn={onCreateOwn}
            onHelp={onHowToPlay}
            onReport={onReportLine}
          />
        </div>
      </div>
      {unlockNotice ? (
        <p
          className={`mb-3 rounded-xl px-4 py-2.5 text-center text-[0.85rem] font-semibold ${
            unlockNotice === t("Unlocked")
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
          role="status"
        >
          {unlockNotice}
        </p>
      ) : null}

      {wrap ? (
        <div className="mb-3">
          <PlayStoreNotice />
        </div>
      ) : null}

      {morePacks ? (
        <div className="pack-search-sticky pack-list-full">
          <PackSearchField value={packQuery} onChange={setPackQuery} />
        </div>
      ) : null}

      <div className="pack-list-grid">
        {showNoMatches ? (
          <div className="pack-list-full mb-3 px-1" role="status">
            <p className="text-[0.85rem] text-fg-muted">{t("No packs match")}</p>
            <button
              type="button"
              onClick={() => setPackQuery("")}
              className="mt-1 text-[0.85rem] font-semibold text-accent"
            >
              {t("Clear search")}
            </button>
          </div>
        ) : null}

        {lead.map((pack) => renderCard(pack))}

        {classicGames ? renderCard(classicGames) : null}

        {vsLondon ? renderCard(vsLondon) : null}

        {white.length ? (
          <>
            <QuietLabel>White</QuietLabel>
            {white.map((p) => renderCard(p))}
          </>
        ) : null}

        {black.length ? (
          <>
            <QuietLabel>Black</QuietLabel>
            {black.map((p) => renderCard(p))}
          </>
        ) : null}

        {clubWeapons ? renderCard(clubWeapons) : null}
      </div>

      <LegalFooter />

      {showSub && (!wrap || offerPlayLabPlus) && (
        <SubscribeModal
          onClose={() => {
            if (!payBusy) setShowSub(false);
          }}
          onSubscribeMonthly={() => {
            void pay("monthly");
          }}
          onSubscribeYearly={() => {
            void pay("yearly");
          }}
          onRestore={() => {
            void playRestore();
          }}
          paymentsEnabled={paymentsEnabled}
          needsAccount={(wrap || paymentsEnabled === true) && !signedIn && !isPending}
          busy={payBusy}
          error={payError}
          playApp={wrap}
        />
      )}

      {modal && (
        <UnlockModal
          packName={modal.pack.name}
          price={modal.price}
          playSku={hasPaidPlaySkuPath(modal.pack)}
          onClose={() => {
            if (!payBusy) setModal(null);
          }}
          onUnlockPack={() => {
            void pay("pack", modal.pack.id);
          }}
          onBuyAll={() => {
            void pay("buy_all");
          }}
          onSubscribeMonthly={() => {
            void pay("monthly");
          }}
          onSubscribeYearly={() => {
            void pay("yearly");
          }}
          onRestore={() => {
            void playRestore();
          }}
          paymentsEnabled={paymentsEnabled}
          needsAccount={(wrap || paymentsEnabled === true) && !signedIn && !isPending}
          busy={payBusy}
          error={payError}
          playApp={wrap}
        />
      )}
    </div>
  );
}

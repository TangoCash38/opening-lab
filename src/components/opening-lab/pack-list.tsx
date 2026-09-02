import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { packPrice } from "@/data/pricing";
import { catalogOffersLabPlus, isLineUnlocked, visiblePacks } from "@/lib/catalog";
import { packLooksFree } from "@/lib/review-free";
import { useUnlocks } from "@/hooks/use-unlocks";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useProgress } from "@/hooks/use-progress";
import {
  clearPendingCheckout,
  confirmCheckoutSession,
  fetchPaymentsEnabled,
  readPendingCheckout,
  savePendingCheckout,
  startCheckout,
  type CheckoutKind,
} from "@/lib/checkout";
import { shouldSkipPackIntro } from "@/lib/pack-intro";
import { isPlayWrap } from "@/lib/play-app";
import {
  hasPlayBillingBridge,
  restorePlayLabPlus,
  startPlayLabPlusYearly,
} from "@/lib/play-billing";
import { LineRow, PackExpandHint } from "./pack-lines";
import { MiniBoard } from "./mini-board";
import { UnlockModal } from "./unlock-modal";
import { SubscribeModal } from "./subscribe-modal";
import { PlayStoreNotice } from "./play-store-notice";
import { HomeHero } from "./home-hero";
import { PackAboutModal } from "./pack-about-modal";
import { LegalFooter } from "./legal-footer";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: TrainMode) => void;
  onHowToPlay: () => void;
};

type ModalTarget = { pack: Pack; price: string };

function QuietLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 mt-5 px-1 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-fg-subtle">
      {children}
    </p>
  );
}

function PackCard({
  pack,
  unlocked,
  onStartLine,
  onRequestUnlock,
  purchasedPackIds = [],
  defaultOpen = false,
}: {
  pack: Pack;
  unlocked: boolean;
  onStartLine: Props["onStartLine"];
  onRequestUnlock: (pack: Pack) => void;
  purchasedPackIds?: readonly string[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { masteryOf, isComplete } = useProgress();
  const free = packLooksFree(pack);
  const price = packPrice(pack);
  const locked = !unlocked;

  const sideClass =
    pack.side === "White"
      ? "bg-tag-white-bg text-tag-white-fg"
      : pack.side === "Black"
        ? "bg-tag-black-bg text-tag-black-fg"
        : "bg-gold-soft text-gold";

  return (
    <div
      className={`mb-3.5 overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] bg-bg-elevated shadow-[var(--shadow-card)] ${
        open ? "border-accent/35" : locked ? "border-border/80" : "border-border"
      }`}
    >
      <button
        type="button"
        className="flex w-full flex-col px-4 pb-3 pt-3.5 text-left"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next && pack.about && !shouldSkipPackIntro()) setAboutOpen(true);
            return next;
          });
        }}
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
                {pack.lines.length} lines
              </span>
              {free ? (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.65rem] font-semibold text-success">
                  Free
                </span>
              ) : unlocked ? (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.65rem] font-semibold text-success">
                  Unlocked
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.65rem] font-semibold text-fg-muted">
                    Pay as you go
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
                  New
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <PackExpandHint open={open} free={free} closedLabel={free ? pack.closedLabel : price ? `${price} · tap to see lines` : "Tap to see lines"} />
      </button>

      {open && (
        <div className="border-t border-border px-3 pb-4 pt-2.5">
          {pack.lines.map((line, i) => {
            const lineUnlocked = isLineUnlocked(pack, line.id, purchasedPackIds);
            const rowLocked = locked || !lineUnlocked;
            const mastery = masteryOf(line.id);
            const complete = !rowLocked && isComplete(line.id);
            return (
              <LineRow
                key={line.id}
                index={i}
                line={line}
                complete={complete}
                mastery={mastery}
                locked={rowLocked}
                showFree={free && lineUnlocked}
                onClick={() => {
                  if (rowLocked) onRequestUnlock(pack);
                  else onStartLine(pack, line);
                }}
              />
            );
          })}
        </div>
      )}

      {locked && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <button
            type="button"
            onClick={() => onRequestUnlock(pack)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-subtle py-2.5 text-[0.82rem] font-semibold text-fg-muted active:scale-[0.99]"
          >
            <Lock className="size-3.5" strokeWidth={2.5} />
            Pay as you go · {price}
          </button>
        </div>
      )}

      {pack.about && aboutOpen ? (
        <PackAboutModal
          title={pack.name}
          about={pack.about}
          packId={pack.id}
          startLabel="Train"
          onClose={() => setAboutOpen(false)}
          onStart={() => {
            setAboutOpen(false);
            const line = pack.lines.find((l) =>
              isLineUnlocked(pack, l.id, purchasedPackIds),
            );
            if (line) onStartLine(pack, line);
          }}
        />
      ) : null}
    </div>
  );
}

export function PackList({ onStartLine, onHowToPlay }: Props) {
  const { canAccess, buyPack, subscribe, paymentsEnabled, state } = useUnlocks();
  const { user, isPending } = useCurrentUserState();
  const signedIn = !!user && !user.isDevFallback;
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const [playApp, setPlayApp] = useState(() => isPlayWrap());
  const resumedCheckout = useRef(false);
  const wrap = playApp || isPlayWrap();

  useEffect(() => {
    setPlayApp(isPlayWrap());
  }, []);

  const catalog = visiblePacks(PACKS);
  const white = catalog.filter((p) => p.section === "white" && p.id !== "scotch");
  const black = catalog.filter((p) => p.section === "black" && p.id !== "vs-london" && p.id !== "caro-kann-black");
  const classicGames = catalog.find((p) => p.id === "classic-games");
  const vsLondon = catalog.find((p) => p.id === "vs-london");
  const clubWeapons = catalog.find((p) => p.id === "club-weapons");
  const morePacks =
    !!classicGames || !!vsLondon || !!clubWeapons || white.length > 0 || black.length > 0;

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
          setUnlockNotice("Payment not confirmed yet");
          return;
        }
        if (result.kind === "pack" && result.packId) {
          buyPack(result.packId);
        } else if (result.kind === "monthly" || result.kind === "yearly") {
          subscribe(result.kind);
        } else if (result.plan === "monthly" || result.plan === "yearly") {
          subscribe(result.plan);
        }
        setUnlockNotice("Unlocked");
      } catch {
        if (!cancelled) setUnlockNotice("Could not confirm payment");
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
  }, [buyPack, subscribe]);

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

  const playYearly = async () => {
    if (!offerPlayLabPlus) return;
    setPayError(null);
    setPayBusy(true);
    try {
      if (isPending) {
        setPayError("Please wait…");
        return;
      }
      if (!signedIn) {
        goToSignIn("yearly");
        return;
      }
      if (!hasPlayBillingBridge()) {
        setPayError("This app build cannot open Google Play Billing yet.");
        return;
      }
      const unlocks = await startPlayLabPlusYearly();
      if (!unlocks) return;
      subscribe("yearly");
      setModal(null);
      setShowSub(false);
      setUnlockNotice("Unlocked");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      if (message === "Sign in required") {
        goToSignIn("yearly");
        return;
      }
      setPayError(message);
    } finally {
      setPayBusy(false);
    }
  };

  const playRestore = async () => {
    if (!offerPlayLabPlus) return;
    setPayError(null);
    setPayBusy(true);
    try {
      if (isPending) {
        setPayError("Please wait…");
        return;
      }
      if (!signedIn) {
        goToSignIn("yearly");
        return;
      }
      if (!hasPlayBillingBridge()) {
        setPayError("This app build cannot open Google Play Billing yet.");
        return;
      }
      await restorePlayLabPlus();
      subscribe("yearly");
      setModal(null);
      setShowSub(false);
      setUnlockNotice("Unlocked");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not restore Lab+";
      if (message === "Sign in required") {
        goToSignIn("yearly");
        return;
      }
      setPayError(message);
    } finally {
      setPayBusy(false);
    }
  };

  const pay = async (kind: CheckoutKind, packId?: string) => {
    if (playApp || isPlayWrap()) {
      setShowSub(false);
      setPayBusy(false);
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
      if (!offerPlayLabPlus) return;
      if (isPending || !signedIn) return;
      const pending = readPendingCheckout();
      if (!pending || pending.kind !== "yearly") return;
      resumedCheckout.current = true;
      clearPendingCheckout();
      void playYearly();
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

  return (
    <div className="pack-list">
      {unlockNotice ? (
        <p
          className={`mb-3 rounded-xl px-4 py-2.5 text-center text-[0.85rem] font-semibold ${
            unlockNotice === "Unlocked"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
          role="status"
        >
          {unlockNotice}
        </p>
      ) : null}

      {wrap ? (
        offerPlayLabPlus ? (
          <div className="mb-3">
            <PlayStoreNotice />
          </div>
        ) : null
      ) : (
        <p className="mb-3 rounded-xl bg-bg-subtle px-4 py-2.5 text-center text-[0.85rem] text-fg-muted">
          Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.
        </p>
      )}

      <HomeHero
        playApp={wrap}
        onStartLine={onStartLine}
        onHowToPlay={onHowToPlay}
        onRequestUnlock={requestUnlock}
        onSubscribe={() => {
          if (wrap && !offerPlayLabPlus) return;
          setPayError(null);
          setShowSub(true);
        }}
      />

      {morePacks ? (
        <p className="mb-3 mt-2 text-[0.88rem] font-semibold text-fg">
          More packs
        </p>
      ) : null}

      {classicGames ? (
        <PackCard
          pack={classicGames}
          unlocked={canAccess(classicGames)}
          onStartLine={onStartLine}
          onRequestUnlock={requestUnlock}
          purchasedPackIds={state.packs}
        />
      ) : null}

      {vsLondon ? (
        <PackCard
          pack={vsLondon}
          unlocked={canAccess(vsLondon)}
          onStartLine={onStartLine}
          onRequestUnlock={requestUnlock}
          purchasedPackIds={state.packs}
        />
      ) : null}

      {white.length ? (
        <>
          <QuietLabel>White</QuietLabel>
          {white.map((p) => (
            <PackCard
              key={p.id}
              pack={p}
              unlocked={canAccess(p)}
              onStartLine={onStartLine}
              onRequestUnlock={requestUnlock}
              purchasedPackIds={state.packs}
            />
          ))}
        </>
      ) : null}

      {black.length ? (
        <>
          <QuietLabel>Black</QuietLabel>
          {black.map((p) => (
            <PackCard
              key={p.id}
              pack={p}
              unlocked={canAccess(p)}
              onStartLine={onStartLine}
              onRequestUnlock={requestUnlock}
              purchasedPackIds={state.packs}
            />
          ))}
        </>
      ) : null}

      {clubWeapons ? (
        <PackCard
          pack={clubWeapons}
          unlocked={canAccess(clubWeapons)}
          onStartLine={onStartLine}
          onRequestUnlock={requestUnlock}
          purchasedPackIds={state.packs}
        />
      ) : null}

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
          onClose={() => {
            if (!payBusy) setModal(null);
          }}
          onUnlockPack={() => {
            void pay("pack", modal.pack.id);
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

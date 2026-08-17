import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { COMING, PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { isPackFree, packPrice } from "@/data/pricing";
import { useUnlocks } from "@/hooks/use-unlocks";
import { useProgress } from "@/hooks/use-progress";
import {
  confirmCheckoutSession,
  fetchPaymentsEnabled,
  startCheckout,
  type CheckoutKind,
} from "@/lib/checkout";
import { MiniBoard } from "./mini-board";
import { UnlockModal } from "./unlock-modal";
import { SubscribeModal } from "./subscribe-modal";
import { MasteryChip } from "./mastery-chip";
import { HomeHero } from "./home-hero";
import { LegalFooter } from "./legal-footer";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: TrainMode) => void;
};

type ModalTarget = { pack: Pack; price: string };

function PackCard({
  pack,
  unlocked,
  onStartLine,
  onRequestUnlock,
  defaultOpen = false,
}: {
  pack: Pack;
  unlocked: boolean;
  onStartLine: Props["onStartLine"];
  onRequestUnlock: (pack: Pack) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { masteryOf, isComplete } = useProgress();
  const free = isPackFree(pack);
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
        className="grid w-full grid-cols-[auto_1fr] items-center gap-3.5 px-4 py-3.5 text-left"
        onClick={() => {
          if (locked) {
            onRequestUnlock(pack);
            return;
          }
          setOpen((v) => !v);
        }}
        aria-expanded={unlocked ? open : undefined}
      >
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
          <div className="mt-1.5 text-[0.72rem] text-fg-subtle">
            {locked
              ? "Tap to unlock"
              : open
                ? "Tap to hide"
                : "Tap to show lines"}
          </div>
        </div>
      </button>

      {open && !locked && (
        <div className="border-t border-border px-3 pb-4 pt-2.5">
          {pack.lines.map((line, i) => {
            const mastery = masteryOf(line.id);
            const complete = isComplete(line.id);
            return (
              <button
                key={line.id}
                type="button"
                className={`mb-1.5 flex w-full items-start gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 text-left active:scale-[0.99] ${
                  complete
                    ? "border-success/35 bg-success-soft/55"
                    : "border-danger bg-danger-soft"
                }`}
                onClick={() => onStartLine(pack, line)}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                    complete ? "bg-success" : "bg-danger"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[0.88rem] font-semibold">
                    <span className="min-w-0 break-words">{line.name}</span>
                    {!complete ? <MasteryChip mastery={mastery} /> : null}
                  </div>
                  {line.players ? (
                    <div className="mt-0.5 text-[0.72rem] text-fg-muted">
                      White {line.players.white} · Black {line.players.black}
                    </div>
                  ) : null}
                  <div className="mt-0.5 text-[0.72rem] text-fg-muted">
                    {line.plies.slice(0, 6).join(" ")} …
                  </div>
                  <p
                    className={`mt-0.5 text-[0.72rem] font-semibold ${
                      complete ? "text-success" : "text-danger"
                    }`}
                  >
                    {complete
                      ? "Complete — train any time"
                      : "Practice with no mistakes to complete"}
                  </p>
                </div>
              </button>
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
    </div>
  );
}

function ComingCard({ name, blurb }: { name: string; blurb: string }) {
  return (
    <div className="mb-3.5 overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-border bg-bg-elevated opacity-85 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-[auto_1fr] items-center gap-3.5 px-4 py-3.5">
        <MiniBoard />
        <div>
          <div className="text-[0.95rem] font-bold">{name}</div>
          <div className="mt-0.5 text-xs text-fg-subtle">{blurb}</div>
          <div className="mt-1.5">
            <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.65rem] font-semibold text-fg-muted">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  count,
  noun = "packs",
  children,
}: {
  title: string;
  count: number;
  noun?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 rounded-[calc(var(--radius-card)+2px)] border-[1.5px] px-4 py-3.5 text-left shadow-[var(--shadow-card)] active:scale-[0.99] ${
          open
            ? "mb-2.5 border-accent/35 bg-bg-elevated"
            : "border-border bg-bg-elevated"
        }`}
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-[0.95rem] font-bold tracking-tight">
            {title}
          </span>
          <span className="mt-0.5 block text-[0.78rem] font-medium text-accent">
            {open
              ? `Showing ${count} ${count === 1 ? noun.replace(/s$/, "") : noun} · tap to close`
              : `${count} ${count === 1 ? noun.replace(/s$/, "") : noun} inside · tap to expand`}
          </span>
        </span>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full ${
            open ? "bg-accent text-accent-fg" : "bg-bg-subtle text-fg"
          }`}
          aria-hidden
        >
          <ChevronDown
            className={`size-5 transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
            strokeWidth={2.5}
          />
        </span>
      </button>
      {open ? <div>{children}</div> : null}
    </div>
  );
}

export function PackList({ onStartLine }: Props) {
  const { canAccess, buyPack, subscribe, paymentsEnabled } = useUnlocks();
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [showSub, setShowSub] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  const white = PACKS.filter((p) => p.section === "white" && p.id !== "scotch");
  const black = PACKS.filter((p) => p.section === "black");
  const classicGames = PACKS.find((p) => p.id === "classic-games");
  const special = PACKS.filter((p) => p.section === "special" && p.id !== "classic-games");

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

  const pay = async (kind: CheckoutKind, packId?: string) => {
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
        const url = await startCheckout(kind, packId);
        window.location.href = url;
        return;
      }
      if (kind === "pack" && packId) buyPack(packId);
      else if (kind === "monthly" || kind === "yearly") subscribe(kind);
      setModal(null);
      setShowSub(false);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <div>
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

      <HomeHero
        onStartLine={onStartLine}
        onSubscribe={() => {
          setPayError(null);
          setShowSub(true);
        }}
      />

      <p className="mb-3 mt-2 text-[0.88rem] font-semibold text-fg">
        More packs · pay as you go or Lab+. Tap a stack to expand.
      </p>

      {classicGames ? (
        <PackCard
          pack={classicGames}
          unlocked={canAccess(classicGames)}
          onStartLine={onStartLine}
          onRequestUnlock={requestUnlock}
        />
      ) : null}

      <AccordionSection title="White openings" count={white.length}>
        {white.map((p) => (
          <PackCard
            key={p.id}
            pack={p}
            unlocked={canAccess(p)}
            onStartLine={onStartLine}
            onRequestUnlock={requestUnlock}
          />
        ))}
      </AccordionSection>

      <AccordionSection title="Black openings" count={black.length}>
        {black.map((p) => (
          <PackCard
            key={p.id}
            pack={p}
            unlocked={canAccess(p)}
            onStartLine={onStartLine}
            onRequestUnlock={requestUnlock}
          />
        ))}
      </AccordionSection>

      <AccordionSection title="Special packs" count={special.length}>
        {special.map((p) => (
          <PackCard
            key={p.id}
            pack={p}
            unlocked={canAccess(p)}
            onStartLine={onStartLine}
            onRequestUnlock={requestUnlock}
          />
        ))}
      </AccordionSection>

      <AccordionSection title="Coming soon" count={COMING.length} noun="packs">
        {COMING.map((c) => (
          <ComingCard key={c.name} name={c.name} blurb={c.blurb} />
        ))}
      </AccordionSection>

      <LegalFooter />

      {showSub && (
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
          paymentsEnabled={paymentsEnabled}
          busy={payBusy}
          error={payError}
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
          paymentsEnabled={paymentsEnabled}
          busy={payBusy}
          error={payError}
        />
      )}
    </div>
  );
}

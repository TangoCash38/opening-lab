import { useState, type ReactNode } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { COMING, PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { isPackFree, packPrice } from "@/data/pricing";
import { useUnlocks } from "@/hooks/use-unlocks";
import { useProgress } from "@/hooks/use-progress";
import { MiniBoard } from "./mini-board";
import { UnlockModal } from "./unlock-modal";
import { TodayStrip } from "./today-strip";
import { MasteryChip } from "./mastery-chip";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: TrainMode) => void;
  onTrainDue: () => void;
};

type ModalTarget = { pack: Pack; price: string };

function PackCard({
  pack,
  unlocked,
  onStartLine,
  onRequestUnlock,
}: {
  pack: Pack;
  unlocked: boolean;
  onStartLine: Props["onStartLine"];
  onRequestUnlock: (pack: Pack) => void;
}) {
  const [open, setOpen] = useState(false);
  const { masteryOf } = useProgress();
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
            return (
              <button
                key={line.id}
                type="button"
                className="mb-1.5 flex w-full items-start gap-2.5 rounded-xl border-[1.5px] border-success/35 bg-success-soft/55 px-3 py-2.5 text-left active:scale-[0.99]"
                onClick={() => onStartLine(pack, line)}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[0.88rem] font-semibold">
                    <span className="min-w-0 break-words">{line.name}</span>
                    <MasteryChip mastery={mastery} />
                  </div>
                  <div className="mt-0.5 text-[0.72rem] text-fg-muted">
                    {line.plies.slice(0, 6).join(" ")} …
                  </div>
                  <p className="mt-0.5 text-[0.72rem] font-semibold text-success">
                    Open — train any time
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

export function PackList({ onStartLine, onTrainDue }: Props) {
  const { canAccess, buyPack, subscribe } = useUnlocks();
  const [modal, setModal] = useState<ModalTarget | null>(null);

  const white = PACKS.filter((p) => p.section === "white");
  const black = PACKS.filter((p) => p.section === "black");
  const special = PACKS.filter((p) => p.section === "special");

  const requestUnlock = (pack: Pack) => {
    const price = packPrice(pack);
    if (!price) return;
    setModal({ pack, price });
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-[1.65rem] font-bold tracking-tight">
        Train openings the strict way
      </h1>
      <p className="mb-5 text-[0.95rem] text-fg-muted">
        Pick a pack, follow the line, build muscle memory. Tap ℹ for how pricing
        and modes work.
      </p>

      <TodayStrip onStartLine={onStartLine} onTrainDue={onTrainDue} />

      <p className="mb-3 text-[0.88rem] font-semibold text-fg">
        Packs start closed. Tap a stack to expand it.
      </p>

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

      {modal && (
        <UnlockModal
          packName={modal.pack.name}
          price={modal.price}
          onClose={() => setModal(null)}
          onUnlockPack={() => {
            buyPack(modal.pack.id);
            setModal(null);
          }}
          onSubscribeMonthly={() => {
            subscribe("monthly");
            setModal(null);
          }}
          onSubscribeYearly={() => {
            subscribe("yearly");
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Chess } from "chess.js";
import { Lock } from "lucide-react";
import type { Pack } from "@/data/packs";
import { packPrice, PRICE_BUY_ALL } from "@/data/pricing";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchPaymentsEnabled, savePendingCheckout, startCheckout } from "@/lib/checkout";
import { canPurchaseBuyAll, canPurchasePack, hasPaidPlaySkuPath } from "@/lib/catalog";
import { useT } from "@/lib/i18n";
import { hasPlayBillingBridge, startPlayBuyAll, startPlayPackBuy } from "@/lib/play-billing";
import { PLAY_SKU_NOT_ON_SALE, isPlayWrap } from "@/lib/play-app";
import { currentPlayAppSellsPack } from "@/lib/play-skus";
import { useUnlocks } from "@/hooks/use-unlocks";
import { ChessBoard } from "./chess-board";

function positionAfter(plies: readonly string[]): Chess {
  const game = new Chess();
  for (const san of plies) game.move(san);
  return game;
}

type Props = {
  pack: Pack;
  plies: readonly string[];
  flip: boolean;
  caption: string;
  percent: number | null;
  onDone: () => void;
};

/** After the free line. Visitors only. Same two-card intro frame as the pack welcome. */
export function NearlyThere({ pack, plies, flip, caption, percent, onDone }: Props) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { buyPack, paymentsEnabled } = useUnlocks();
  const { user, isPending } = useCurrentUserState();
  const signedIn = !!user && !user.isDevFallback;
  const game = useMemo(() => positionAfter(plies), [plies]);
  const price = packPrice(pack);
  const locked = pack.lines.slice(1, 10);
  const playWrap = mounted && isPlayWrap();
  const soldInCurrentPlayApp =
    currentPlayAppSellsPack(pack.id) && hasPaidPlaySkuPath({ id: pack.id, isFree: false });
  const playPackHeld = playWrap && !soldInCurrentPlayApp;
  const offerBuyAll = playPackHeld && canPurchaseBuyAll();
  const result =
    percent != null ? t("{pct}%", { pct: percent }) : caption.trim() || t("Practice done");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !price || !canPurchasePack(pack.id)) return null;

  const goSignIn = () => {
    savePendingCheckout({ kind: "pack", packId: pack.id });
    window.location.href = "/login?next=checkout";
  };

  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isPlayWrap()) {
        if (isPending) {
          setError(t("Please wait…"));
          return;
        }
        if (!signedIn) {
          goSignIn();
          return;
        }
        if (!hasPlayBillingBridge()) {
          setError(t(PLAY_SKU_NOT_ON_SALE));
          return;
        }
        if (!currentPlayAppSellsPack(pack.id) || !hasPaidPlaySkuPath({ id: pack.id, isFree: false })) {
          if (!canPurchaseBuyAll()) {
            setError(t(PLAY_SKU_NOT_ON_SALE));
            return;
          }
          const unlocks = await startPlayBuyAll();
          if (unlocks) onDone();
          return;
        }
        const unlocks = await startPlayPackBuy(pack.id);
        if (unlocks) onDone();
        return;
      }

      const live =
        paymentsEnabled === true
          ? true
          : paymentsEnabled === false
            ? false
            : await fetchPaymentsEnabled();
      if (live) {
        if (isPending) {
          setError(t("Please wait…"));
          return;
        }
        if (!signedIn) {
          goSignIn();
          return;
        }
        const url = await startCheckout("pack", pack.id);
        window.location.href = url;
        return;
      }
      buyPack(pack.id);
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Payment failed");
      if (message === "Sign in required") {
        goSignIn();
        return;
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const notice = (
    <div
      className="slav-notice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nearly-there-title"
      data-nearly-there
    >
      <div className="slav-intro-board" data-nearly-board>
        <ChessBoard
          game={game}
          flip={flip}
          selected={null}
          wrongUntil={null}
          expected={null}
          showHints={false}
          lastMove={null}
          slide={null}
          onSlideComplete={() => {}}
          onSquare={() => {}}
          interactive={false}
        />
        <p className="slav-intro-caption" data-nearly-caption>
          {t("Where the line ends")}
        </p>
      </div>
      <div className="slav-notice-card" data-nearly-card>
        <div className="slav-notice-card-body">
          <p className="slav-notice-kicker">{t("Nearly there")}</p>
          <h2 id="nearly-there-title" className="slav-notice-title">
            {pack.name}
          </h2>
          <p className="slav-notice-paragraph">{t("10 lines from Opening Lab.")}</p>
          <p className="slav-notice-subtitle">{t("Your result")}</p>
          <p className="slav-notice-tagline" data-nearly-result>
            {result}
          </p>
          <p className="slav-notice-paragraph">{t("Lines 2 to 10 stay locked.")}</p>
          <ul className="nearly-locked" data-nearly-locked>
            {locked.map((item, index) => (
              <li key={item.id} data-nearly-line={item.id}>
                <span className="nearly-locked-index">{index + 2}</span>
                <span className="nearly-locked-name">{item.name}</span>
                <span className="nearly-locked-badge">
                  <Lock className="size-3" strokeWidth={2.5} aria-hidden />
                  {t("Locked")}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {playPackHeld ? (
          <p className="slav-notice-paragraph" data-nearly-play-hold>
            {t(PLAY_SKU_NOT_ON_SALE)}
          </p>
        ) : null}
        <button
          type="button"
          className="slav-notice-primary"
          data-nearly-unlock
          disabled={busy}
          onClick={() => {
            void unlock();
          }}
        >
          {offerBuyAll
            ? t("Buy all · {price}", { price: PRICE_BUY_ALL })
            : t("{price} unlocks the whole pack", { price })}
        </button>
        {error ? (
          <p className="nearly-error" data-nearly-error role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="nearly-dismiss" data-nearly-not-now onClick={onDone}>
          {t("Not now")}
        </button>
      </div>
    </div>
  );

  return createPortal(notice, document.body);
}

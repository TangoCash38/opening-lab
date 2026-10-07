import { PRICE_BUY_ALL } from "@/data/pricing";

type Props = {
  lead: string;
};

/**
 * End-of-session path into the drill packs.
 * Opening Traps and Caro-Kann have free lines. Buy all stays the existing
 * packs-home route (`/#gym`), where that one-time offer already lives.
 */
export function SessionPackCta({ lead }: Props) {
  return (
    <aside className="session-pack-cta" data-session-pack-cta>
      <p className="session-pack-cta-lead">{lead}</p>
      <a
        className="session-pack-cta-primary"
        data-session-pack-primary
        href="/#pack/opening-traps"
      >
        Try Opening Traps
      </a>
      <p className="session-pack-cta-more">
        <a data-session-pack-caro href="/#pack/caro-kann-black">
          Caro-Kann
        </a>
        <span aria-hidden="true"> · </span>
        <a data-session-pack-buy-all href="/#gym">
          {`Buy all · ${PRICE_BUY_ALL}`}
        </a>
      </p>
    </aside>
  );
}

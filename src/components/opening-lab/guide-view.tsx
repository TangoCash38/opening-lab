import { Link } from "@tanstack/react-router";
import { LegalFooter } from "./legal-footer";

type Props = { onBack: () => void };

export function GuideView({ onBack }: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        ← Back
      </button>
      <h1 className="mb-4 font-display text-[1.65rem] font-bold tracking-tight">
        User guide
      </h1>

      <Block title="What is Opening Lab?">
        Strict-line memory training. You play only the moves in the chosen
        opening; wrong moves are rejected so the line sticks.
      </Block>

      <Block title="Caro-Kann for Black">
        The Caro-Kann is Black's answer to 1.e4. You take a pawn centre, get
        the light bishop out, and keep a solid structure. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. Free sample: Advance, Classical, Exchange. Other Caro lines are in the full pack.
      </Block>

      <Block title="Queen’s Gambit Declined for Black">
        The Queen’s Gambit Declined is Black's solid answer to 1.d4. You
        hold the centre, develop, then challenge it. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup and see where the game goes. 18
        book lines.
      </Block>

      <Block title="Stop the London System">
        The London is White's solid d4 setup with Bf4. You hit the
        centre, pressure b2, and trade that bishop when you can. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. Black vs the London. 18
        book lines.
      </Block>

      <Block title="1.d4 Sideline Survival Kit">
        Meet White's 1.d4 sidelines as Black: Colle, Torre, Trompowsky,
        Veresov, and the Blackmar-Diemer. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="Anti-Sicilian Survival Kit">
        Meet White's anti-Sicilians as Black: Alapin, Grand Prix, Closed,
        Smith-Morra, Rossolimo, and the Wing Gambit. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="Nimzo-Larsen Attack for White">
        Play the Nimzo-Larsen as White: 1.b3, Bb2, and the central plans against …e5, …d5, …c5,
        and the fianchetto. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="Italian Game Mastery for White">
        Play the Italian as White: quiet d3 systems, the Giuoco Piano, Two Knights, Evans Gambit, and the Hungarian. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="Ruy Lopez Mastery for White">
        Play the Ruy Lopez as White: Closed Spanish, Berlin, Exchange, Open, Marshall, and Schliemann. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="French Defence for White: Advance & Tarrasch">
        Meet the French as White: Advance, Tarrasch, Classical, Winawer, and Exchange. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Sicilian: The Alapin for White">
        Meet the Sicilian as White with the Alapin: 2.c3 and d4 against …Nc6, …d5, …Nf6, …e6, …d6, and …g6. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet 1.c4: The Symmetrical English for Black">
        Meet 1.c4 as Black with the Symmetrical English: Four Knights, Botvinnik, Hedgehog, and reversed-Sicilian centres. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Defend Against the King’s Gambit">
        Defend the King’s Gambit as Black: Knight’s Gambit, Fischer, Classical Accepted, Bishop’s Gambit, and Falkbeer. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Scandinavian Defence: White’s Safe Edge">
        Meet the Scandinavian as White: the queen lines, Modern 2…Nf6, Portuguese, and Icelandic. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Pirc & Modern Defence: The 150 Attack">
        Meet the Pirc and Modern as White with the 150 Attack: Be3, Qd2, and a supported centre. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Dutch Defence: The Fianchetto System for White">
        Meet the Dutch as White with the fianchetto: g3, Bg2, and c4 against Classical, Stonewall, and Leningrad. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Caro-Kann: Advance & Panov for White">
        Meet the Caro-Kann as White with the Advance and the Panov. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Defend Against the Evans Gambit for Black">
        Defend the Evans Gambit as Black: accepted Ba5 and Be7, and declined Bb6. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Englund Gambit: White’s Safe Route">
        Meet the Englund Gambit as White: take on e5, develop, and do not let the queen raid dictate the game. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Meet the Budapest Gambit: White’s Safe Route">
        Meet the Budapest as White: Alekhine 4.Bf4/e3/Nf3, the main-line Qd5, and the Fajarowicz. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="How to Defend Against the Blackmar–Diemer Gambit for Black">
        Defend the Blackmar-Diemer as Black: Gunderam, Teichmann, Euwe, and Bogoljubow. Practice the main book moves with the yellow hint. Then Test with none to prove you remember them. Play on from the setup if you want. 18 lines. Free.
      </Block>

      <Block title="White & Black / Special packs">
        Each pack trains one opening. You play the book side.
      </Block>

      <Block title="Practice mode">
        Yellow hints show the next move. The opponent replies automatically.
        Follow the exact line. Practice does not complete the line.
      </Block>

      <Block title="Test mode">
        No hints. Play your side only. Wrong squares flash red until you find
        the book move. A clean Test (zero mistakes) turns the line green. If
        you think a rejected move is book, send it with Wrong move? If we
        confirm it, you get a pack free.
      </Block>

      <Block title="Play on">
        After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.
      </Block>

      <Block title="Reviews">
        A clean Test turns the line green. You can train it again anytime.
      </Block>

      <Block title="Account">
        Use the profile icon (top right) to sign in. See{" "}
        <Link to="/privacy" className="font-semibold text-accent">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" className="font-semibold text-accent">
          Terms
        </Link>
        .
      </Block>

      <LegalFooter />
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 rounded-[var(--radius-card)] border border-border bg-bg-elevated px-4 py-4">
      <h3 className="m-0 mb-1.5 text-base font-semibold">{title}</h3>
      <p className="m-0 text-[0.9rem] leading-relaxed text-fg-muted">{children}</p>
    </div>
  );
}

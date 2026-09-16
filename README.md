# Opening Lab

Strict chess opening memory training — Practice & Test modes, animated board, free Scotch Gambit plus premium packs.

## Stack

- React 19 + TypeScript + Vite 8
- TanStack Start / Router
- Tailwind CSS v4
- chess.js
- CBurnett piece SVGs (`public/pieces/`)

## Pricing (GBP)

| Tier | Price |
|------|--------|
| **Scotch Gambit** (5 main lines and 2 traps) | Free |
| 5-line packs | **£1** |
| 8–10 line packs | **£1.99** |
| **Opening Lab+** | **£4.99 / month** or **£29.99 / year** |
| Pay as you go | **£1** or **£1.99** per pack, keep forever |

Demo unlocks use `localStorage` (`src/lib/unlocks.ts`).

## Email (welcome + purchases)

On Vercel, set **`RESEND_API_KEY`** so Opening Lab can send:

- Welcome after someone creates an email account
- Lab+ welcome after they subscribe
- Pack confirmation after they buy a pack

From: `Opening Lab <support@openinglab.co.uk>`.  
Without the key the site still works; emails are skipped.

Optional fallback if you already have a mailbox: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.

## Deploy to Vercel

**One-click import (recommended):**

[https://vercel.com/new/clone?repository-url=https://github.com/TangoCash38/opening-lab](https://vercel.com/new/clone?repository-url=https://github.com/TangoCash38/opening-lab)

Or:

1. Open [vercel.com/new](https://vercel.com/new)
2. Import **`TangoCash38/opening-lab`**
3. Framework: **Other** / Vite (Nitro outputs `.vercel/output` via `npm run build`)
4. Build command: `npm run build`
5. Output: handled by the Nitro Vercel preset (no extra config needed)

CLI (if you have a token):

```bash
npx vercel login
npx vercel --prod
```

## Project structure

```text
src/
  components/opening-lab/
    app-shell.tsx       # Native-style header + views
    pack-list.tsx       # Packs, locks, prices
    unlock-modal.tsx    # Pay as you go / Lab+
    train-view.tsx      # Practice / Test
    chess-board.tsx     # Sliding pieces
    chess-pieces.tsx
    guide-view.tsx
    mini-board.tsx
  data/
    packs.ts            # Lines + isFree / isPremium / price
    pricing.ts          # £1 / £1.99 / Lab+ £4.99 mo · £29.99 yr
  hooks/use-unlocks.ts
  lib/unlocks.ts
  routes/
  styles.css            # Tokens, board, touch CSS
public/
  pieces/
  manifest.webmanifest
  favicon.svg
  og.jpg
```

## Practice-review Engine (server)

After a finished Practice line or a wrong-move review, App Dev can POST
`/api/practice-review-eval` for a short MultiPV-2 Engine eval (depth 14,
hard cap 16, wall ~2.5s). **Practice only** — never Test, free play, or
mid-drill.

**Vercel has no Stockfish binary.** Leave **`STOCKFISH_PATH` unset** on
Vercel; the handler fail-softs `{ ok: false }` (HTTP 200) so the UI can
hide the eval bar / PVs and keep Expert “why” text. Live eval comes later
via a small **worker that sets `STOCKFISH_PATH`** (e.g. `/usr/games/stockfish`
or `/usr/bin/stockfish`) and is reached as **`PRACTICE_REVIEW_EVAL_URL`**
(same `POST` contract). Do **not** ship WASM Stockfish (or any GPL engine
net) to the client or the Play WebView bundle.

Product copy should say **Engine**, not “Lichess / Stockfish cloud”.

## Scripts

```bash
npm install
npm run dev        # 0.0.0.0:8080
npm run build
npm run typecheck
```

## GitHub

https://github.com/TangoCash38/opening-lab

## Google Play (Android)

The Play app is a raw System WebView (not Chrome TWA). Lab+ yearly uses
native Play Billing (`lab_plus_yearly`). Packs stay on the website (Stripe).
Project and build steps: [`android/README.md`](android/README.md).


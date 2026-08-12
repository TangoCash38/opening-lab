# Opening Lab

Strict chess opening memory training — Learn & Practice modes, animated board, free Scotch Gambit plus premium packs.

## Stack

- React 19 + TypeScript + Vite 8
- TanStack Start / Router
- Tailwind CSS v4
- chess.js
- CBurnett piece SVGs (`public/pieces/`)

## Pricing (GBP)

| Tier | Price |
|------|--------|
| **Scotch Gambit** (10 lines) | Free |
| 5-line packs | **£1** |
| 8–10 line packs | **£1.99** |
| **All-Access Pass** | **£9.99** |

Demo unlocks use `localStorage` (`src/lib/unlocks.ts`).

## Project structure

```text
src/
  components/opening-lab/
    app-shell.tsx       # Native-style header + views
    pack-list.tsx       # Packs, locks, prices
    unlock-modal.tsx    # Unlock / All-Access
    train-view.tsx      # Learn / Practice
    chess-board.tsx     # Sliding pieces
    chess-pieces.tsx
    guide-view.tsx
    mini-board.tsx
  data/
    packs.ts            # Lines + isFree / isPremium / price
    pricing.ts          # £1 / £1.99 / £9.99
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

## Scripts

```bash
npm install
npm run dev        # 0.0.0.0:8080
npm run build
npm run typecheck
```

## GitHub export notes

- Ignore `node_modules/`, `.vercel/`, `screenshots/`
- No secrets required for the chess demo
- PWA manifest: `/manifest.webmanifest`

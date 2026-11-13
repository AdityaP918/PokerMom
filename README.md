# PokerMom

An offline-first Texas Hold’em learning table designed for Meena. PokerMom has no accounts, ads, tracking, timers, or real-money play.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. To create the offline production package:

```bash
npm run test
npm run build
```

The installable app is generated in `dist/`. Serve that folder over HTTPS (or localhost) once to install it; after installation it runs offline.

## Share it with Meena

1. Run `npm run build`.
2. Upload the contents of the generated `dist/` folder to an HTTPS static host. A host with drag-and-drop static deployment is the simplest option.
3. Send Meena the resulting web address.
4. On Android, she opens it in Chrome, opens the browser menu, and chooses **Install app** or **Add to Home screen**.
5. On iPhone or iPad, open it in Safari, tap Share, then **Add to Home Screen**.
6. On a Mac or Windows computer, use it in the browser or choose the browser's Install option when available.

The layout responds to phones, tablets, laptops, display zoom, and large system text. The device needs internet for the first visit only; the service worker caches the complete game for later offline play. Saved games and notebook entries remain on that individual device.

## Fair bots

Bots receive a privacy-filtered `PlayerView`: their own cards, shared cards, public bets, stacks, and action history. It deliberately excludes the deck, future cards, folded cards, and every opponent’s private cards. Their hidden personality is randomized independently of card strength, while confidence, pressure, suspicion, and bluff opportunity evolve from visible events during the hand.

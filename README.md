# XBorg website prototype v3

Static review prototype for the XBorg website and its holder apps, Stake and Earn. It contains no wallet connection, signatures, contract calls, live data, or production deployment. Production `xborg.com` is unchanged.

## Where this lives

The prototype lives in `Prototype/` of `XBorgLabs/xborg-lp`, added by PR #48 (branch `chore/add-prototype-folder`). Nothing in the production Next.js app imports it, and the root `tsconfig.json` excludes it. The PR's Vercel preview builds the production app, not this prototype. To share the prototype, run it locally and tunnel it (see `docs/round6/HANDOVER.md`).

This PR does not carry the earlier history (rounds 3 to 5 and the October Stake work). A snapshot of that history is the orphan branch `prototype/website-v3`, frozen at 5658ff0 on 18 October 2026, with an old preview at https://xborg-lp-git-prototype-website-v3-xb-org.vercel.app.

**Start here if you are picking this up:** `docs/round6/HANDOVER.md` covers the current round, the rules that hold, and what comes next.

Review screenshots stay out of git because they come to about 250 MB. `npm run test:layout` writes them to `review-shots/` locally.

## Run locally

```bash
npm install
npm run fonts
npm run dev
```

Open `http://127.0.0.1:5174`.

## Verify and build

```bash
npm test
npm run test:layout
npm run build
npm run preview
```

`npm run build` writes the static site to `dist/`. The preview command serves that build on `http://127.0.0.1:5174`.

## Review states

Landing:

* `#workspace`
* `#propr`
* `#fanbase`
* `#trigr`

Stake (the former XBG Portal, renamed in October 2026). The review selector groups these as Stake and Stake dialogs:

* `#stake-entry`, the visitor view before a wallet connects
* `#stake-restricted`, the region block page
* `#stake-no-xbg`, `#stake-not-verified`, `#stake-linked`, `#stake-check-unavailable`
* `#stake-eligible`, `#stake-eligible-nft`
* `#stake-active`, `#stake-not-earning`, `#stake-all-pledged`, `#stake-balance-error`
* `#stake-upcoming`, `#stake-season-closed`
* `#stake-history`, `#stake-positions`, `#stake-positions-empty`
* `#stake-verify-email`, `#stake-verify-sign`, `#stake-verify-refused`, `#stake-verify-done`
* `#stake-pledge-amount`, `#stake-pledge-invalid`, `#stake-pledge-confirm`, `#stake-pledge-signing`, `#stake-pledge-rejected`, `#stake-pledge-submitting`, `#stake-pledge-done`, `#stake-pledge-lost`, `#stake-pledge-refused`
* `#stake-leaderboard`, `#stake-unstake-confirm`

Every old `#portal-*` link still works. It opens the closest Stake state and the address changes to that state's name. Missions, referrals and access levels are gone, so their links open `#stake-active`.

Stake brings the live `xborg.com/earn` programme into the desktop: pledge XBG for the season while it stays in the wallet, meet one eligibility option, see the multiplier, the leaderboard and completed seasons, and manage the closed staking positions. Wallet prompts appear as a labelled Demo wallet panel with Sign or Confirm and Reject, so every flow can be reviewed without a wallet. Nothing is signed or sent. Two demo rules: an email containing `taken` is refused when linking, and Re-check always finds the purchase or plan.

Earn:

* `#earn`, an empty window. Its product is not defined yet.

Documentation:

* `#system`, the living design system sheet
* `#references`, the round 5 Mobbin reference board
* `#notes`

Round 5 uses Direction A, Calm, chosen on 24 September 2026. Tokens live in `src/styles/tokens.css`. Layout is in `layout.css`, structure in `structure.css`, the shared app structure in `portal.css`, the visual system in `components.css`, and the Stake views and dialogs in `stake.css`. `npm test` fails if a raw style value appears outside the tokens. `?present=1` hides the review bar. Evidence capture: `node scripts/capture-round5.mjs <set> '' [all|trio]`, `node scripts/capture-system.mjs x <set>` `node scripts/capture-m7.mjs [set]` and `node scripts/compare-sheet.mjs <before> <after>`. Pixel comparison while refactoring styles: `npx playwright test -c playwright.visual.config.ts`, with `--update-snapshots` to record a new baseline.

Taste QA round (October 2026): `node scripts/capture-round5.mjs <set> '' all --root taste-qa --widths 1440,1024,390 [--present] [--scroll] [--only id,id]` captures every state into `review-shots/taste-qa/<set>`. `node scripts/qa-scan.mjs <set>` measures every state for overflow, clipped text, overlap, target size, contrast, console errors, keyboard focus and reduced motion, and writes `docs/taste-qa/qa-scan-<set>`. `node scripts/taste-qa-mocks.mjs [p1,p2]` renders the concept proposal mocks. The report is `docs/taste-qa/QA_REPORT.md`.

Round 6 (November 2026) adds the living desktop: a WebGL cloud sky behind every window (`src/sky.ts`) and an Ask field in the menu bar that opens with ⌘K (`src/ask.ts`, `src/components/AskBar.tsx`). Its styles are in `desk.css`. The windows part of the round is not built yet. See `docs/round6/HANDOVER.md`.

The compact review bar contains Prototype, Prev and the screen selector.

## Runtime dependencies

| Package | Purpose | Licence |
| --- | --- | --- |
| React and React DOM | Interface rendering | MIT |
| Motion | Interface transitions | MIT |

## Development dependencies

| Package | Purpose | Licence |
| --- | --- | --- |
| Vite and React plugin | Development server and static build | MIT |
| TypeScript | Type checking | Apache 2.0 |
| Vitest | Unit tests | MIT |
| Playwright | Browser tests, screenshots, and recordings | Apache 2.0 |
| jsdom | Unit test browser environment | MIT |
| React and Node type packages | Type declarations | MIT |

No component library is installed.

## Self hosted fonts

| Family | Files | Licence |
| --- | --- | --- |
| Archivo variable | `public/fonts/archivo-wdth-wght.woff2` | SIL Open Font License 1.1 |
| Geist Sans | `public/fonts/geist-sans-400.woff2`, `public/fonts/geist-sans-500.woff2`, `public/fonts/geist-sans-600.woff2` | SIL Open Font License 1.1 |
| Geist Mono | `public/fonts/geist-mono-400.woff2`, `public/fonts/geist-mono-500.woff2` | SIL Open Font License 1.1 |

## Assets needing replacement or approval

* Replace the round 2 studio wallpaper with a licensed production asset.
* Replace the generic dock glyphs with approved product marks.
* Decide whether Propr needs an authenticated trading interface capture.
* Refresh and approve all product captures before launch.
* Refresh or date the Propr revenue statement before launch.
* Approve every Stake figure. Season 20 figures follow the live page on 17 October 2026. The holder wallet, its history, rank and PROPR allocation are invented.
* Define the Earn product.

## Project boundaries

The prototype is hash driven and non functional. Do not treat its Stake states as approved economics or implementation requirements. Do not deploy it over `xborg.com`, `XBG/xborg-lp`, or the round 2 prototype.

## XBorg OS V2 (November 2026)

This copy (`D:\XBORG\XBorgOS-V2`) replaces the chat workspace with the desktop from the Figma file "XBorg OS" (node 37:352). The code lives in `src/os/`:

* `Desktop.tsx` holds the open windows, All apps (mission control), the desktop icons and the hooks into Stake and Earn, which keep their previous windows.
* `Notifications.tsx`: cards arrive one after another; hover shows a cross, swipe left dismisses.
* `OsDock.tsx` and `OsSearch.tsx`: the dock and its search field, which reuses `src/ask.ts` (same questions, answers and app shortcuts as the old Ask field, ⌘K or Ctrl K to focus).
* `OsWindow.tsx`: window chrome (drag by the title bar, double click or the corner button for full screen, Escape closes the front window).
* `Cursor3D.tsx`: the floating glass cursor, rendered with three.js from `public/os/cursor.glb`, exported from `Cursor.blend` with its camera. It is off on touch screens, with reduced motion, or with `?cursor=off`.
* `os.css`: every style for the desktop, with values from Figma, including the thin custom scrollbars.

Stake and Earn now open in the same window chrome as the products; their content is unchanged. The review bar is gone, but every review state still opens from its address (for example `#stake-active`).

Assets exported from Figma are in `public/os/`. The XBG widget figures (5.79%, chart) are the design's demo values. The Playwright suites in `tests/` still describe the round 6 workspace and need rewriting for this desktop; `npm test` (unit tests) passes.

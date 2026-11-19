# Round 6 handover: the living desktop

Read this before changing anything in `Prototype/`. It covers what round 6 set out to do, what is built, the rules that hold, and what comes next.

## The goal

Gauthier asked for the prototype to "stand out". He approved a three part plan on 13 November 2026:

1. **Sky.** Replace the flat wallpaper with a dark dithered cloud field like the TinyMails website. Done.
2. **Menu bar.** Add one Ask field in the middle (⌘K), and show the wallet balance. Done.
3. **Windows.** Make the desktop behave like a real one: several windows open at once, open from and close into the dock, minimise, snap, a remembered layout. **Not started.**

Two smaller ideas are also approved in principle: the chat types itself on first load, and the Stake numbers count up the first time Stake opens. Neither is started.

Gauthier reviews on a rendered build, one screen at a time. Show him the result of each part before starting the next.

## Rules that hold

These come from earlier rounds. Several are enforced by tests.

| Rule | Where it is enforced |
| --- | --- |
| No clock or system indicator in the menu bar | `tests/milestone5.spec.ts` |
| Dock icons never bounce, wave or play a launch animation. Hover lifts 3px at scale 1.05, press 1px at 1.02, and nothing else | Gauthier, October 2026 |
| Every CSS colour, size, spacing, radius and shadow comes from `src/styles/tokens.css` | `src/test/tokens-only.test.ts` |
| No dash characters in public copy. Wrap new copy in `assertPublicCopy` | `src/copyGuard.ts`, `src/test/copy.test.ts` |
| No APY, APR, shareholder, investor, equity or "guaranteed" | `src/test/copy.test.ts` |
| One accent colour, violet `#8572fc` | `tokens.css` |
| Minimal UI: one focus per screen, generous space, detail behind a click, no helper sentences or placeholder text | Gauthier |
| Respect `prefers-reduced-motion` everywhere | `tests/reduced-motion.spec.ts` |
| Stake is demo data only. Nothing signs or sends | `src/components/stake/config.ts` |

## What round 6 built

```text
src/
├── sky.ts                 # WebGL cloud field: scenes, shaders, render loop
├── ask.ts                 # Ask field content and search
├── components/
│   ├── Sky.tsx            # mounts the canvas, passes scene and chat scroll
│   ├── AskBar.tsx         # trigger, ⌘K, list, answer view
│   ├── TopBar.tsx         # now hosts AskBar and the wallet balance
│   └── Workspace.tsx      # renders <Sky>, shares openApp() with dock and Ask
├── styles/
│   ├── desk.css           # all round 6 styles, loaded last
│   └── tokens.css         # new --x-ask-* and --x-dur-sky tokens
└── wallet.ts              # WALLET_BALANCE
tests/round6.spec.ts       # sky, Ask and wallet pill behaviour
docs/round6/shots/         # before and after screenshots
```

### Sky (`src/sky.ts`)

It is ported from `site/src/scripts/sky.ts` in the TinyMails repo (`Gauthi3r/tinymails`). It draws in two passes. The first works out a cloud value per 4px cell and cuts it into four levels with an 8x8 ordered dither. The second draws each cell as a rounded dot.

What changed from TinyMails:

- **Scenes follow the app in front, not the scroll.** `SCENES` has `night` (the workspace), `stake`, `earn`, `propr`, `fanbase` and `trigr`. `Workspace.tsx` passes `activeAppId ?? 'night'`. The sky eases to the new scene with a time constant of about 0.4s.
- **The clouds part around the front window.** Each frame, `frontWindow()` finds the window to clear around. It prefers an element marked `[data-front="true"]`, then the last open `.window[role="dialog"] .window-frame`, then the chat window. The clear zone is a rounded box with a soft edge (`uWin` and `uCalm` in the shader). A `MutationObserver` redraws when windows move under reduced motion.
- **Phones.** Below 900px the chat fills the screen, so the clear zone works at 45 percent strength.
- **Chat scroll** drifts the clouds slightly (`setDrift`).
- **Fallbacks.** Without WebGL, `createSky` returns null, the canvas stays at opacity 0 and the gradient wallpaper shows. Under reduced motion the clouds hold still and scene changes snap.

To tune a scene, edit its palette (four colours, darkest first; the fourth only ever shows as sparse dots), `cover` (more clouds when higher), `contrast`, `scale` (smaller clouds when higher) and `calm` (how much the clouds thin out around the window). Keep products within a few degrees of violet.

### Ask (`src/ask.ts`, `src/components/AskBar.tsx`)

- **Content.** Every answer reuses copy the site already shows: the chat beats, `PRODUCTS` and the Stake season pool. Don't write new claims here. A production build would put a real agent behind the same field.
- **Search.** Every typed word must appear in the item's title or keywords. When the query exactly matches an app name, the Apps group moves first, so Enter opens that app.
- **Empty field.** The list opens with the first four questions, then the apps.
- **Keyboard.** Escape calls `stopPropagation`. Without that, the `AppWindow` Escape handler would also close the window behind. The panel lives inside `.topbar`, which `AppWindow`'s focus trap allows.
- **Screen size.** Desktop only. The field is hidden below 900px.

## Next: the windows round

Today the app is single-window by design.

```text
App.tsx            screen: ScreenId  (one hash = one state)
  Workspace.tsx    productOpen | stakeOpen | earnOpen  -> at most one app window
    XborgWindow    dimmed when any app is open
    ProductWindow  opens when screen is propr, fanbase or trigr
    StakeWindow    opens when screen is a stake-* state
    EarnWindow     opens when screen is earn
AppWindow.tsx      dialog, aria-modal, focus trap, Escape closes
useDesktopWindow   drag, resize, maximise; rects kept in a module Map until reload
```

Suggested order, one reviewable step each:

1. **Several windows at once.** Keep a list of open apps and a z-order in `Workspace` alongside `screen`. Keep the hash as the front window's state, so every review link still works. Mark the front window with `data-front="true"`; the sky already reads it. Stop dimming the chat when an app opens, and lower the shadow and opacity of windows behind instead. `AppWindow` is `aria-modal` with a focus trap today. That has to become per-window focus, so clicking a background window brings it forward.
2. **Open from and close into the dock.** `ProductWindow`, `StakeWindow` and `EarnWindow` already receive `origin`, the centre of the dock tile, and use it as `transformOrigin`. Scale from the tile on open and back into it on close, on a spring with no overshoot. The dock icons themselves must not move.
3. **Minimise.** A third window control. The window shrinks into its dock tile and keeps its rect. The tile keeps its running dot.
4. **Snap.** Dragging to the left or right edge shows an outline, then fills that half on release. Double-clicking the title bar maximises.
5. **Throw.** Release velocity carries the window a few pixels, clamped inside `desktopArea()`.
6. **Remembered layout.** Persist `memory` from `useDesktopWindow` to `localStorage`. Wrap every read and write in try/catch.
7. **Keys.** ⌘W closes the front window, Escape closes the front window only, ⌘\` cycles windows.

Expect these to need updating: `tests/milestone5.spec.ts` (the chat keeps its position under Stake), `tests/milestone7.spec.ts` and `tests/milestone8.spec.ts` (window geometry), `tests/keyboard.spec.ts` (focus), `tests/stake-journey.spec.ts`. Change a test's expectation only when the old one described single-window behaviour on purpose.

After windows: the typed chat (`src/components/Conversation.tsx`, once per visit, skippable with a click) and the Stake count-up (`src/components/stake/RewardsView.tsx`).

## Open questions for Gauthier

- The chat copy still says "missions" and "monthly rewards", but Stake has neither. The copy test locks the current wording.
- The Stake estimate (1,307 XBG) uses the whole season even with 14 days left.
- "Pledgers all time" actually counts stakers.
- Taste QA proposals P1, P3, P4 and most of P5 are still unbuilt (`docs/taste-qa/QA_REPORT.md`).

## Running and checking

```bash
cd Prototype
npm ci
npm run dev             # http://127.0.0.1:5174, ?present=1 hides the review bar
npm test                # unit tests, including tokens-only and copy
npm run test:layout     # Playwright, about 240 tests in under a minute
npm run build
```

Tips:

- **WebGL in headless screenshots.** Launch Chromium with `--enable-unsafe-swiftshader --use-angle=swiftshader`, or the sky won't draw. The test suite doesn't need these flags.
- **Missing Playwright browser.** Another project on the same machine can delete the pinned Chromium. If Playwright says the executable doesn't exist, run `npx playwright install chromium`.
- **Remote preview.** To share the dev server, start Vite with `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.trycloudflare.com npm run dev`, then run `cloudflared tunnel --url http://127.0.0.1:5174`.
- **Vercel.** The PR's Vercel preview builds the production Next.js app at the repo root, not this prototype. The root `tsconfig.json` excludes `Prototype/`, so the Next build no longer type-checks it.

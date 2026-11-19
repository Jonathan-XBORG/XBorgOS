# Desktop Chat and Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the current chat sequence as the default desktop content and open every product, including XBG Portal, from the dock without replacing the desktop shell.

**Architecture:** `App` keeps route ownership while `Workspace` becomes the persistent renderer for landing and Portal routes. A new `PortalWindow` adapts the existing Portal components to desktop dialog chrome and mobile full-screen presentation. Existing conversation state remains mounted while routes change, so closing an app preserves scroll position.

**Tech Stack:** React 19, TypeScript, Motion, CSS, Vitest, Playwright, Vite

**Spec:** `docs/superpowers/specs/2026-09-04-desktop-chat-and-dock-design.md`

## Global Constraints

- Do not touch `xborg.com`, `XBG/xborg-lp`, or the round 2 prototype.
- Do not add public copy, product claims, token economics, wallet behavior, or new features.
- Keep the approved XBorg colors, typography, icons, chamfers, wallpaper, and imagery.
- Do not use an Apple logo, clock, or red, yellow, and green controls.
- The document must never scroll at 1440px, 390px, or 320px.
- The first conversation beat must be fully visible on load; later messages reveal on scroll.
- Nothing in the dock is selected on load.
- Do not start Milestone 6 or claim that Milestone 5 is cleared.

---

### Task 1: Route Portal through the persistent workspace

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Workspace.tsx`
- Modify: `src/components/Dock.tsx`
- Test: `src/test/screens.test.ts`
- Test: `tests/milestone5.spec.ts`

**Interfaces:**
- Consumes: existing `ScreenId`, `isLandingScreen`, `isPortalScreen`, and `onGo(ScreenId)` routing.
- Produces: `Workspace` renders for every non-notes screen and treats product or Portal routes as an app layered over the conversation.

- [ ] **Step 1: Write failing route and persistence tests**

Add a unit assertion that Portal screen IDs qualify for the workspace shell. Add Playwright coverage that opens Portal from `[data-dock="portal"]`, confirms `.workspace` and `.window-portal`, scrolls before opening, closes Portal, and compares the conversation scroll position before and after.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- src/test/screens.test.ts && npx playwright test tests/milestone5.spec.ts --grep "Portal|preserves"`

Expected: FAIL because Portal currently replaces `.workspace` and no `.window-portal` exists.

- [ ] **Step 3: Keep Workspace mounted for Portal routes**

Update `App` so all non-notes screens render `Workspace`. Pass the current `screen`, `onGo`, and direct Portal routing without the 700ms full-screen expansion timer. Update `Workspace` so `appOpen` covers product and Portal screens, the conversation window dims while any app is open, and close returns to `workspace`.

- [ ] **Step 4: Mark Portal active only while it is open**

Update `Dock` so its active type includes `portal` and derives `portal` from Portal screen IDs. Keep the idle workspace free of `aria-current` and `.dock-dot`.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- src/test/screens.test.ts && npx playwright test tests/milestone5.spec.ts --grep "Portal|preserves"`

Expected: PASS.

### Task 2: Add a Portal app window

**Files:**
- Create: `src/components/PortalWindow.tsx`
- Modify: `src/components/PortalEntry.tsx`
- Modify: `src/components/portal/Portal.tsx`
- Modify: `src/components/Workspace.tsx`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/chrome.css`
- Modify: `src/styles/portal.css`
- Test: `tests/milestone5.spec.ts`
- Test: `tests/keyboard.spec.ts`

**Interfaces:**
- Consumes: `screen: ScreenId`, `origin: WindowOrigin | null`, `onGo(ScreenId)`, and `onClose()`.
- Produces: `PortalWindow({ screen, origin, onGo, onClose })`, a focus-trapped dialog at 900px and wider and a full-screen mobile app below 900px.

- [ ] **Step 1: Write failing window behavior tests**

Cover `role="dialog"`, the title `XBG PORTAL`, Escape close, focus return, desktop containment, mobile full-screen bounds, and existing Portal hash navigation.

- [ ] **Step 2: Run the focused browser tests and verify failure**

Run: `npx playwright test tests/milestone5.spec.ts tests/keyboard.spec.ts --grep "Portal window|Portal from dock"`

Expected: FAIL because Portal renders as a separate page.

- [ ] **Step 3: Implement `PortalWindow`**

Use `AnimatePresence`, `motion.section`, `useReducedMotion`, the existing neutral `WindowControls`, and the same focus-trap behavior as `ProductWindow`. Render `PortalEntry` for entry routes and `Portal` for all other Portal routes. Use a 280ms scale from `0.94` and opacity from `0`; reduced motion uses opacity only.

- [ ] **Step 4: Make Portal content embeddable**

Add an `embedded` prop to `PortalEntry` and `Portal`. In embedded mode, remove the duplicate page-level Portal header while keeping connect, home, navigation, and screen actions available inside the app content. Keep one semantic `main` region.

- [ ] **Step 5: Add desktop and mobile Portal window layout**

At 900px and wider, size the window to `min(1180px, calc(100vw - 96px))` by `min(760px, calc(100dvh - 152px))`. At smaller widths, use the full viewport and remove the desktop clip path. Scope Portal height rules to `.window-portal .portal-app` so standalone review behavior does not leak.

- [ ] **Step 6: Run the focused tests**

Run: `npx playwright test tests/milestone5.spec.ts tests/keyboard.spec.ts --grep "Portal window|Portal from dock"`

Expected: PASS.

### Task 3: Tighten the macOS desktop structure using XBorg styling

**Files:**
- Modify: `src/styles/layout.css`
- Modify: `src/styles/chrome.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/components/ProductWindow.tsx`
- Test: `tests/milestone5.spec.ts`
- Test: `tests/reduced-motion.spec.ts`

**Interfaces:**
- Consumes: existing `.topbar`, `.window-xborg`, `.window-product`, `.window-portal`, and `.dock` structure.
- Produces: consistent dimensions and motion tokens shared by all desktop windows.

- [ ] **Step 1: Add failing geometry and motion assertions**

Assert a 28px menu bar, centred conversation window with clear space for the dock, 36px app title bars, document scroll height equal to viewport height, a Portal opening scale of at least `0.9`, and no transform animation under reduced motion.

- [ ] **Step 2: Run the focused layout tests and verify failure**

Run: `npx playwright test tests/milestone5.spec.ts tests/reduced-motion.spec.ts --grep "menu bar|opening scale|page never scrolls"`

Expected: FAIL on the current 48px menu bar and `0.74` opening scale.

- [ ] **Step 3: Normalize geometry and spacing**

Set the desktop menu bar to 28px, move the conversation window into the visual space between it and the dock, and use the approved spacing values 4, 8, 12, 16, 24, 32, 40, 48, and 64px. Preserve the first-beat visibility rule.

- [ ] **Step 4: Normalize depth and motion**

Keep XBorg chamfers and neutral controls. Use a layered border, inset highlight, environmental shadow, and translucent dock. Change product and Portal windows to 280ms open and 220ms close with `0.94` and `0.96` scale endpoints. Change hover and focus feedback to 180ms.

- [ ] **Step 5: Run focused layout and reduced-motion tests**

Run: `npx playwright test tests/milestone5.spec.ts tests/reduced-motion.spec.ts`

Expected: PASS.

### Task 4: Verify the revised Milestone 5 and regenerate evidence

**Files:**
- Modify: `scripts/capture-milestone5.mjs`
- Replace: `review-shots/m5-1440-workspace.png`
- Replace: `review-shots/m5-390-workspace.png`
- Replace: `review-shots/m5-load-slow-scroll.webm`
- Test: `src/test/*.test.ts`
- Test: `tests/*.spec.ts`

**Interfaces:**
- Consumes: the finished desktop, chat, dock, product, and Portal behaviors.
- Produces: a committed Milestone 5 revision with current screenshots, recording, and verification results.

- [ ] **Step 1: Update evidence capture**

Capture the default load at 1440 by 900 and 390 by 844. Record a fresh 1440 by 900 load followed by slow conversation scrolling. Keep app-window screenshots only where the handover requires supporting states.

- [ ] **Step 2: Run all verification commands**

Run: `npm test`

Expected: all Vitest tests pass.

Run: `npm run test:layout`

Expected: all Playwright tests pass at configured viewports.

Run: `npm run build`

Expected: TypeScript and Vite finish with exit code 0.

- [ ] **Step 3: Inspect screenshots and recording**

Confirm the first beat is visible at both widths, no dock item is selected on load, the desktop does not scroll, window chrome stays within the viewport, and the recording advances the chat without moving the page.

- [ ] **Step 4: Commit the Milestone 5 revision**

Run: `git add src tests scripts review-shots docs && git commit -m "Milestone 5: keep chat as the desktop default"`

Expected: a new commit after `ef9a2eb426d3cd283a07ebe680f6c6158accfe13` and a clean worktree.

- [ ] **Step 5: Report the Milestone 5 gate**

Use the exact handover headings. Include the commit hash, verification totals, 1440px and 390px screenshots, recording path, open dependencies, and the explicit statement that external Head of Strategy review is required. Do not say the gate is cleared.


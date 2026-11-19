# Desktop chat and dock design

## Status

Approved in chat by Gauthier Collas on 2026-09-04. This document records the Milestone 5 revision. It does not clear the milestone gate.

## Goal

Make the existing `xborg-lp` conversation the default foreground experience inside a desktop that reads as macOS in structure and XBorg in every visual detail. Products and the XBG Portal open from the dock as apps without replacing the desktop.

## Desktop structure

- The viewport is a fixed desktop. The document never scrolls.
- A 28px translucent menu bar stays at the top. It contains no Apple logo and no clock.
- One centred XBorg conversation window is visible on load.
- The first conversation beat is fully visible on load.
- The conversation window body is the only scroll region. Beat two and later messages reveal once as they enter that region.
- A translucent dock stays centred near the bottom edge.
- No dock item is selected on load because the conversation is the desktop itself, not a dock app.

## Dock and windows

- The dock keeps the existing Propr, FanBase, Trigr, XBG Portal, X, and Discord items.
- Product buttons open their existing product windows above the conversation.
- The XBG Portal button opens the existing Portal experience in a larger desktop app window above the conversation.
- An open product or Portal shows one running indicator beneath its dock icon.
- App windows open from the corresponding dock icon using opacity and scale. They close back toward that icon.
- Closing an app restores keyboard focus to its dock button and leaves the conversation at its previous scroll position.
- Only one app window is open at a time.

## Portal containment

- Portal routes remain addressable through their existing hashes for review.
- On desktop, each Portal route renders inside the persistent desktop shell.
- The Portal window supplies the app chrome. Portal content must not add a second full-page header or full-viewport background.
- Portal navigation and state screens continue to use the existing copy, values, and prototype behavior.
- On screens below 900px, Portal may occupy the full viewport. This is the mobile app presentation, not a simulated desktop.

## Visual rules

- Keep the approved XBorg palette, typography, icons, chamfers, wallpaper, and product imagery.
- Use macOS structure through proportions and behavior: a compact menu bar, layered windows, a dock, soft environmental blur, and clear elevation.
- Do not use an Apple logo, a clock, or red, yellow, and green window controls.
- Use the existing neutral XBorg window controls.
- Use one spacing rhythm based on 4, 8, 12, 16, 24, 32, 40, 48, and 64px.
- Keep interactions quick: about 120ms for press feedback, 180ms for controls, and 280ms for windows and views.
- Reduced-motion mode removes scale and travel while preserving immediate state changes.

## Accessibility and responsive behavior

- The conversation scroll region remains keyboard focusable and labelled.
- Dialog windows trap focus, close on Escape, and return focus to their launcher.
- The active dock app uses `aria-current`; the idle desktop has no `aria-current` dock item.
- Portal content has one main region and marks its current navigation item.
- At 390px, the conversation remains the default load experience and the document still does not scroll.
- At 320px, controls and dock items remain operable without horizontal document overflow.

## Acceptance criteria

1. Loading `/#workspace` at 1440px shows the first chat beat, a compact menu bar, and an idle dock.
2. A slow wheel gesture anywhere on the desktop advances the conversation without moving the page.
3. Later chat messages reveal in sequence and remain visible after scrolling back.
4. Each dock product opens above the chat and closes back to the desktop.
5. XBG Portal opens as a desktop app window at 1440px and as a full-screen app at 390px.
6. Closing any app preserves the conversation scroll position.
7. Existing screen hashes, review controls, keyboard paths, and reduced-motion behavior still work.
8. `npm test`, `npm run test:layout`, and `npm run build` pass.
9. The Milestone 5 package includes screenshots at 1440px and 390px plus a recording of load followed by slow scroll.


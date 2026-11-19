# Round 5 audit, before state

Measured on commit 3266cef, 24 September 2026, at 1440 by 900 and 390 by 844. Screenshots are in `review-shots/r5/before`.

## Type

* 18 font sizes in the style sheets, from 9px to 72px. Nothing limits them to a scale.
* Mono appears in beat labels, window titles, badges, stat values, wallet chips, review bar and dock tooltips. It no longer marks data because it marks everything.
* Portal figures such as 25,000 XBG and 1M XBG are set in 14px mono. They are the most important numbers on the screen and among the smallest.
* Headings mix Archivo 800, Archivo 500 and Geist 600 with no rule for which level gets which.

## Colour

* 31 colour values bypass the tokens, including #f1f1f3 for tiles (seven times), #b4b4bf as a second grey, and green, amber and pink for status.
* Bubble fill (#12121c) and window fill (#0e0e16) are almost the same tone, so bubbles barely separate from the window.
* The wallpaper photograph from round 2 shows laptops with the Apple logo. It fails acceptance check 10 and cannot return as it is.

## Spacing and layout

* The first beat leaves the lower half of the chat window empty on load. Beat 2 starts from a forced minimum height.
* The last beat leaves about 30 percent of the window empty under the Portal card, because of a 20vh bottom padding.
* Every bubble is a fixed 75 percent block, so a four word message takes the same width as a two line one.
* On mobile, bubbles wrap after three or four words, and the dock and review bar sit over the conversation.
* The Portal window bottom sits 16px from the dock.
* Spacing values in the Portal are 7, 9, 11, 13, 15, 17 and 22px alongside the 4px scale.

## Buttons

* Five kinds of action share one Portal screen: white chamfered primary, outlined chamfered secondary, underlined text action, outlined preset chip and outlined filter chip.
* The menu bar Connect Wallet is a white chamfered block. Its 10px cut on a 30px button looks like a rendering fault.
* Primary hover lifts by 2px and turns violet, so the one accent also means "hovered".

## Chrome

* Window titles use brackets, a blinking LIVE label, HUD corner ticks and three square controls. Only one control works.
* Clip path and drop shadow sit on the same element, so the chamfer clips the window shadow away. Windows look flat.
* Dock tiles are heavy white blocks. The tray chamfer and shadow read as broken, and neighbouring tiles shift on hover.
* The Portal header row holds a label, a demo badge, a wallet chip and a reset link, plus the window title above it.

## Interaction

* Focus rings appear without a keyboard: on the chat window after load, and on the close control whenever a window opens.
* The menu bar wallet and the Portal wallet do not share state. The Portal can show a wallet while the menu bar still says Connect Wallet.
* Present mode no longer hides the review bar.
* Windows cannot be moved or resized.
* One browser test fails intermittently. It measures the Portal window while its opening animation is still running (719.996px against 720px).

## Status after Milestone 8, 25 September 2026

Every item above is fixed. How each one was handled:

* **Type.** Seven sizes, all tokens. Mono is kept for wallet addresses. Portal figures are set in Archivo at 22px.
* **Colour.** Every colour comes from tokens. A unit test fails if a raw value appears outside tokens.css, apart from two exceptions listed on the design system screen. Bubbles sit one tone above the window. The wallpaper is generated and contains no photograph.
* **Spacing and layout.** One 4px scale. The first beat rests at the foot of the window and the last beat ends at the Portal card. Bubbles shrink to their text. On mobile the dock is a bar and the chat ends above it. The Portal window keeps at least 24px above the dock.
* **Buttons.** One family: primary, secondary and quiet. Each screen has one primary. The wallet control is sized to the menu bar. Hover no longer uses the accent.
* **Chrome.** One window chrome, with no brackets, LIVE label or HUD ticks. Windows cast real shadows. Dock tiles are dark, and only the hovered tile magnifies. The Portal header row is gone: one Demo Data label sits in the title bar.
* **Interaction.** Focus rings show for keyboard users only and are never clipped. The wallet state is shared. Present mode works. Windows move, resize and maximise. The flaky test waits for the animation.

Found and fixed during Milestone 8: the product window's Visit action sat below the fold, the mobile product sheet had lost its padding, the chat window's focus ring was clipped, reduced motion still magnified the dock, and the design system screen overflowed at 320px.

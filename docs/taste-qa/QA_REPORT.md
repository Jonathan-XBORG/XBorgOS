# Taste QA, Milestone Q1 report

Branch `taste-qa`, from `36fe0d9`. Written 15 October 2026.

This is the QA pass and the list of proposed improvements. Defects are fixed and committed. Craft findings and concept proposals are not built. They wait for Gauthier to clear them.

Screenshot folders, all under `review-shots/taste-qa/`:

* `before/` holds every review state at 1440, 1024 and 390, with and without the review bar (`present-` prefix), plus each further screen of every scrolling state (`-scroll-n`) and the focus evidence (`-focus-`).
* `defects/` holds the same screens after the defect fixes.
* `states/` holds interactive states that no hash route reaches: dialogs, toasts, empty filters, the wallet menu and dock hover.
* `proposals/` holds the concept mock screenshots.

## 1. What was verified

* `npm test`: 28 passed. That is the 27 from round 5 plus a new contrast check on the ink tokens.
* `npm run test:layout`: 188 passed. That is the 182 from round 5 plus 6 regression tests for the defects below.
* `npm run build`: passes.
* Defect scan (new script `scripts/qa-scan.mjs`), run on all 25 states at 1440, 1024 and 390, plus every state with reduced motion. Before the fixes, low-contrast text showed in 73 of the 75 state and width combinations (514 instances). Six keyboard stops were hidden behind the mobile tab bar, and the reward table scrolled sideways on three states. After the fixes all three are at zero. In both runs there were no console errors, the page itself never scrolled, and no animation kept running under reduced motion.
* Keyboard. 741 keyboard stops across all states and widths, each with a visible ring after the fixes.
* Pixel harness. 77 of 86 comparisons still match the round 5 baseline. The 9 that differ are the stake confirmation modal (rows now aligned) and the system sheet, as expected. The harness's default colour tolerance let the contrast change through without a single failure. If colour regressions should be caught in Q2, the tolerance needs tightening. The new baseline is recorded only in Q2, as the brief says.
* Not verified: real screen reader output (only roles and names were checked) and Safari or Firefox (Chromium only).

## 2. Defects

Fixed and committed separately from everything else (commits `7d3b2bc` and `f1f12ab`). Before shots are in `before/`, after shots in `defects/`.

| # | Defect | Where | Cause | Fix | Evidence |
| --- | --- | --- | --- | --- | --- |
| D1 | Small grey text failed WCAG AA contrast: every Portal stat label, row label and section label, "Live" and "Early access", the chat beat numbers, Reset Demo State, mission type. 3.0 to 3.8:1 against 4.5:1. | All Portal states, product windows and chat, all widths | The third ink token, #6f6f79, was too dark for every surface it sits on | Ink 3 is now #8c8c96, which passes 4.5:1 on every surface up to the raised one and stays a clear step below secondary text. A unit test now checks all three inks on all surfaces. | `before/1440-portal-home.png` against `defects/1440-portal-home.png` |
| D2 | Keyboard focus parked controls under the mobile tab bar. Start Mission was invisible when focused, and Reset Demo State showed only a sliver of ring. Fails WCAG 2.4.11. | Missions and Rewards at 390 | The Portal body had no scroll padding for the fixed tab bar | Scroll padding the height of the tab bar, from a new token for that height | `before/390-focus-start-mission-under-tabbar.png` against `defects/390-focus-start-mission-under-tabbar.png` |
| D3 | Reward history on a phone was a five column table that scrolled sideways out of its card. The Transaction column was off screen and dates broke over three lines. | Rewards, Season complete, Legacy at 390 | A table with a minimum width inside a narrow card | Below 560px of Portal width each row stacks: date and source on the left, amount on the right, status and transaction underneath. Table roles are kept for screen readers. | `before/390-portal-rewards-scroll-2.png` against `defects/390-portal-rewards-scroll-2.png` |
| D4 | "View transaction" opened Etherscan with a shortened demo hash, which can never resolve. That makes it a dead link and an outbound call from a prototype. | Rewards history | The link used the display hash | The shortened hash now shows as plain text in the address face | same as D3 |
| D5 | The Portal window opened 12px from the dock and 12px from the menu bar at 1280 by 800 and 1024 by 768. Round 5 set at least 24px. | Portal at laptop sizes | The default size filled the whole desktop area on shorter screens | Windows opening at their default size keep 24px at both ends. 1440 is unchanged, and Maximise still fills the desktop as round 5 tested. | `before/1024-portal-home.png` against `defects/1024-portal-home.png` |
| D6 | In the stake confirmation, each label sat about 6px above its value. | Stake preview and pending, all widths | Rows aligned to the top, with different line heights | Rows share a baseline | `before/1440-portal-stake-preview.png` against `defects/1440-portal-stake-preview.png` |
| D7 | The Design notes, Design system and References pages, and long Portal dialogs, took keyboard focus with no visible ring. | `#notes`, `#system`, `#references`, dialogs | The browser makes long scroll areas focusable, and the focus rule did not cover them | Those scroll areas draw the ring inside their edge | `before/1440-focus-notes-article.png` (no ring); after: ring inside the page edge |
| D8 | Staking an empty amount showed "Enter an amount of XBG to stake." next to the violet success tick | Stake card, all widths | Every toast drew the same tick | Toasts carry a tone. The one error the Portal raises shows a neutral mark in the error colour. | `states/1440-state-stake-zero.png` against `defects/1440-state-stake-zero-error-toast.png` |

Open defects that need a decision, not fixed:

| # | Defect | Why it is not fixed |
| --- | --- | --- |
| D9 | 10 of the 18 Portal review states show another state's screen. Stake amount equals Holds XBG. Stake pending equals Stake preview. Stake done, Home quiet and Mobile home equal Home. Missions empty and Missions referrals equal Missions. Season complete and Legacy positions equal Rewards. Mobile entry equals Entry. Legacy positions shows no legacy stake at all, although the guardrails say active legacy stakes and unstake access must never be hidden. | Portal states are fixed in this round and round 6 reworks staking. Either relabel or remove the duplicates in the review list, or design the missing screens in round 6. Gauthier decides. |
| D10 | A connected holder with no XBG sees the same stake card as a holder with 48,750 XBG, with 25,000 prefilled and an active Stake XBG button. They only learn they hold none after pressing it. | Portal behaviour is fixed. Worth folding into round 6. |

## 3. Craft findings, ranked by impact

Things that work but look generic or unfinished. None is built. "Touches" names the tokens and components each change would affect.

| # | What is wrong | Proposed change | Touches |
| --- | --- | --- | --- |
| C1 | Portal screens have no lead figure. Every number is 22px, so 25,000 XBG staked weighs the same as 26 days remaining. Round 5 asked for figures set beautifully. | Concept proposal P1: one hero figure per screen | Season panel, reward summary, figure type tokens |
| C2 | Experience cards use two-letter placeholder tiles ("VE", "PR", "FO", "ST", and "VE" twice) over a violet gradient. Each locked card repeats its own Stake More button, four in a row. This is the most unfinished-looking part of the Portal. | Concept proposal P3: an access ladder | Experience grid, card, gradient token |
| C3 | Labels repeat. The Portal entry says XBG Portal three times (title bar, label, heading). Home shows "Active season / You are in Season 19." and then "Season position / Season 19", and its primary button and section heading are both "Earn additional XBG". Product windows say PROPR in the title bar and again as the heading. Every Portal section has a small grey label above its heading. | Drop the small label wherever the heading already says it, and remove duplicate headings. Label words are moved, never invented. | Portal kicker, product head, entry |
| C4 | The chat's beat labels carry index numbers (01 to 05) and a hairline rule, which reads as a template rather than a conversation. Bubbles that wrap keep their full width, which leaves a ragged gap on the right ("G2 / and Cloud9."). | Concept proposal P2 | Beat label, bubble |
| C5 | Button labels mix Title Case and sentence case on the same screens: Stake More, Start Mission, Claim Rewards, Confirm Stake, Review Stake, View Reward History, Reset Demo State and Connect Wallet against Earn additional XBG, View all missions and Enter the XBG Portal. | Sentence case on every button. Connect Wallet would become Connect wallet, which round 5 named, so this needs a yes. | Button labels only |
| C6 | Mono has spread beyond wallet addresses. It sets the Access Level line on experience cards ("Level 1 Member") and the dates and amounts in reward history. | Text face with tabular figures. Mono stays for addresses and transaction hashes only. | Experience level, reward table |
| C7 | Product windows crop the capture through the product site's own buttons. The capture date sits on top of the screenshot. On a phone the sheet is half empty under the Visit button. | Concept proposal P4 | Product media, capture label, mobile sheet |
| C8 | The stake card has rough edges. The amount shows unformatted (25000) while the chips show 25,000, and a browser spinner appears on hover. The same figure is "User XBG balance" on the card and "Wallet balance" in the dialog, and "Estimated reward position" on the card but "Estimated reward" elsewhere. Under the card, three equal text-only tiles each hold one grey line. | Format the amount and hide the spinner. Give each figure one name ("Wallet balance", "Estimated reward"). Fold the three tiles into the heading's supporting line or a single quiet list. | Amount field, stake preview grid, benefit strip |
| C9 | Violet leaks out of its three jobs. The stake success mark and the toast tick are violet squares, and the activity bullets are violet. Available and Completed share one green dot. In progress and In review share one violet dot. | Success marks round and neutral (or the success green), activity bullets neutral, In review on the warning tone. Violet stays for progress, selection and focus. | Confirmation mark, toast mark, activity dot, status badge |
| C10 | The phone layout has loose ends. Dock labels are tracked capitals (PROPR, FANBASE), which loses the FanBase casing and differs from the Portal tab bar. The Portal title sits 20px right of centre in present mode. Long Portal headings run to three lines. The reward pool floats alone on its own row. | Concept proposal P5 | Dock label, Portal header, heading, season panel |
| C11 | Rewards metrics sit in a 3 + 2 grid with an empty slot and vertical hairlines. The "View Reward History" button only moves focus to the table directly beneath it. | Part of P1: four metrics in one row, claimable amount leads. Remove the focus-only button, or make it open a full history. | Reward summary |
| C12 | In the mission dialog the "Steps" heading (22px) is larger than the dialog title (17px). The detail grid's two columns sit on slightly different tones. | Title at the larger size, Steps as a label. One surface for the detail grid. | Mission dialog |
| C13 | Mission cards show the venture as a letter (F, P, X) while the dock already has proper product marks. | Use the product marks from the dock | Mission card |
| C14 | Portal Home alone has 29 blocks of text at 12px, most of them labels. With D1 they now pass contrast, but they are still small for an investor audience. | Labels at 13px. Keep 12px for badges only. | Type scale use, not the scale itself |
| C15 | Copy tone. "Stake XBG. Enter the ecosystem." and "unlock missions" are stock crypto phrasing. Trigr's "all in one platform" is a stock phrase. The Portal card in the chat is a three-part slogan ("Stake XBG. Help XBorg grow. Earn monthly rewards."). Portal headings end with full stops while section headings do not. | Plain, specific wording, with no new claims and no figure changes. Pick one rule for heading full stops. Each line would be shown to Gauthier first, because round 5 froze the Portal copy. | Copy only |
| C16 | The dock's X glyph is grey and smaller than the white Discord glyph next to it. Dock buttons announce their names in capitals to screen readers ("PROPR"). | One glyph weight and colour for both social tiles. Real casing in the accessible name, with capitals done in styling. | Dock |
| C17 | The phone homepage has no wallet control at all, because the menu bar is hidden. The only way to connect is Enter the XBG Portal. | Decide whether phones get a wallet control in the hero or keep the single route | Mobile hero |
| C18 | Stake confirmed appears twice at once, in the dialog and in a toast behind it. | Skip the toast while the success dialog is open | Portal toast |

## 4. Concept proposals

Five bigger ideas, all within the desktop concept, Direction A and the fixed list. Each is a mock: the running prototype with token-based styles and small layout moves injected, photographed by `scripts/taste-qa-mocks.mjs`. Nothing in the prototype changes until one is cleared. No figure, claim or feature is added.

### P1. Figures first in the Portal

Home leads with the holder's position: 25,000 XBG staked at display size. Estimated reward, Access Level and time remaining sit below it as one calm row, with no divider lines. The reward pool moves to the top right of the card, and the repeated "Season position / Season 19" heading goes. Rewards leads with the claimable amount, 500 XBG, set large above Claim rewards, and the other four metrics fill one row with no empty slot. This is the move that makes the Portal read like a well-run financial product, the way Mercury or Revolut put the balance first.

Mocks: `proposals/p1-1440-home.png`, `p1-1440-rewards.png`, `p1-390-home.png`, `p1-390-rewards.png`. Compare with `before/1440-portal-home.png` and `before/1440-portal-rewards.png`.

### P2. The chat reads as a conversation

Beat labels become quiet centred separators, the way messaging apps mark a new day. The index numbers and the hairline go. Bubbles that wrap shrink to their longest line, so a two-line message no longer carries an empty strip on the right. The script and the beats are unchanged.

Mocks: `proposals/p2-1440-beat-1.png`, `p2-1440-beat-4.png`, `p2-390-beat-1.png`, `p2-390-beat-4.png`. Compare with `before/1440-workspace.png` and `before/1440-workspace-beat-5.png`.

### P3. Experiences as an access ladder

The five experiences become one list grouped by Access Level. Level 1 Member is unlocked, with View on its experience. Level 2 Builder and Level 3 Core each show "Stake 25,000 more XBG to unlock" once, with one Stake more button for the level. The placeholder tiles go, and the section is about half as tall. It shows the progression a holder is climbing, which the grid hides.

Mocks: `proposals/p3-1440-experiences.png`, `p3-390-experiences.png`. Compare with `before/1440-portal-home-scroll-1.png` and `before/390-portal-home-scroll-2.png`.

### P4. Product windows lead with the product

The status (Live, Early access) moves into the title bar, where Demo Data already sits in the Portal. The capture shows the top of the real site uncut, at its true 16:9 shape, with its date as a quiet line underneath. On a phone the window becomes a sheet that hugs its content, with the chat dimmed above it, instead of a full-height sheet that is half empty.

The phone sheet changes a round 5 rule (full-screen sheets below 900px), so it is a separate yes or no.

Mocks: `proposals/p4-1440-propr.png`, `p4-1440-trigr.png`, `p4-390-propr.png`, `p4-390-trigr.png`. Compare with `before/1440-propr.png` and `before/390-propr.png`.

### P5. One phone language

The mobile dock labels use real product casing (Propr, FanBase, Trigr, XBG Portal) with no tracking, matching the Portal's own tab bar. The Portal header stops reserving room for the review menu in present mode, so its title is centred. Portal headings keep two lines on a phone by setting the display face at normal width there. The reward pool joins the season figures.

Mocks: `proposals/p5-390-workspace.png`, `p5-390-portal-home.png`, `p5-390-portal-participate.png`. Compare with `before/390-present-workspace.png` and `before/390-portal-participate.png`.

## 5. Critique scores

Scored on the before screenshots with the taste skill's critique rubric: design 40%, usability 30%, creativity 20%, content 10%. "Capped" applies the rubric's caps. Any inspector failure that remains after the allowed overrides limits a screen to 6.0. In practice that means the beat numbers, the generic gradients, hairlines, mono labels and tracked capitals.

| Screen | Seen in one second | Design | Usability | Creativity | Content | Overall | Capped |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage, desktop | The X mark in a dark window, then bubbles | 7 | 7.5 | 7.5 | 7 | 7.25 | 6.0 |
| Homepage, phone | "An AI startup studio." | 7 | 7 | 7 | 7 | 7.0 | 6.0 |
| Product windows | The product capture | 6.5 | 7.5 | 6.5 | 7 | 6.85 | 6.0 |
| Portal Home, desktop | "You are in Season 19." and a row of equal numbers | 6.5 | 7.5 | 6 | 6.5 | 6.7 | 6.0 |
| Portal Home, phone | The full-width Earn additional XBG button | 6 | 7 | 6 | 6.5 | 6.35 | 6.0 |
| Stake card and dialogs | The amount field | 6.5 | 7 | 6 | 6.5 | 6.55 | 6.0 |
| Missions | The mission card's grid of facts | 6.5 | 7.5 | 6 | 7 | 6.75 | 6.0 |
| Rewards | "Your XBG rewards." | 6.5 | 7 | 6 | 7 | 6.6 | 6.0 |

Idea, in one sentence: XBorg tells its story as a conversation on a desktop where its products are apps you can open, and holders live in one of them. Live thing: the conversation, whose product names open real product windows, and the Portal's working stake and mission flows.

Critiques, in the rubric's format, for the three screens that carry the most weight:

```
ROUND 1, Homepage desktop
Seen in one second: the X mark centred in a dark window, then a column of grey bubbles.
Idea: the company explains itself in a chat on its own desktop.
Live thing: product names in messages open product windows.
Layout words by beat: conversation / conversation + attachments / conversation / conversation / conversation + attachment.
Scores: design 7 · usability 7.5 · creativity 7.5 · content 7 → overall 7.25.
Caps applied: index numbering and a hairline on every beat label → 6.0 while they remain.
Top three problems:
1. Beat labels "01 Who we are" plus a rule read as a template (1440-workspace.png). Fix: P2.
2. Wrapped bubbles keep their full width, leaving an empty strip (1440-workspace-beat-3.png). Fix: P2.
3. The Portal card in the chat has a violet gradient and a three-part slogan (1440-workspace-beat-5.png). Fix: flat bubble tone, one sentence (C15).

ROUND 1, Portal Home desktop
Seen in one second: "You are in Season 19." and four figures of equal weight.
Layout words by section: heading / stat card / mission card / card grid / list.
Scores: design 6.5 · usability 7.5 · creativity 6 · content 6.5 → overall 6.7.
Caps applied: mono labels, divider hairlines, placeholder tiles → 6.0.
Top three problems:
1. No lead figure. The stake, the reward and the time left all weigh the same (1440-portal-home.png). Fix: P1.
2. Placeholder monogram tiles and four repeated Stake More buttons (1440-portal-home-scroll-1.png, -scroll-2.png). Fix: P3.
3. Every section pairs a small grey label with a heading, and two of them repeat the page heading or the primary button (1440-portal-home.png). Fix: C3.

ROUND 1, Portal Home phone
Seen in one second: the full-width white button.
Scores: design 6 · usability 7 · creativity 6 · content 6.5 → overall 6.35.
Top three problems:
1. The reward pool floats alone on its own row (390-portal-home.png). Fix: P1 or P5.
2. Experience cards squeeze titles onto two lines beside the Locked badge, under placeholder tiles (390-portal-home-scroll-2.png). Fix: P3.
3. The header title sits right of centre (390-portal-home.png, present mode). Fix: P5.
```

Honest summary: the prototype is clean and consistent. Scored as a juror who did not build it, it is a tidy, well-built kit that does not yet lead with anything. P1, P2 and P3 together address the lowest scores directly.

## 6. Redesign checklist, screen by screen

The redesign skill's audit, applied to every state. "Pass" means nothing to fix.

| Area | Homepage and chat | Product windows | Portal desktop | Portal phone | Design system pages |
| --- | --- | --- | --- | --- | --- |
| Typography: hierarchy, measure, weights, tabular figures, orphans | C4 | C3 | C1, C14 | C10 (3-line heading) | Pass |
| Colour and surfaces: one accent, gradients, shadows | Gradient on Portal card (C15) | Pass | C2, C9 | C9 | Pass |
| Layout: alignment, rhythm, equal cards, holes | Pass (empty top on load is the decided opening) | C7 | C8 (three equal tiles), C11 | C10 | Pass |
| Interactivity and states: hover, press, focus, loading, empty, error | Pass | Pass | D2, D6, D8 fixed. Empty states pass. | D2 fixed | D7 fixed |
| Content: stock phrases, exclamation marks, case | C15 | C15 (Trigr) | C5, C15 | C5 | Pass |
| Component patterns: generic cards, pill badges, modals | Pass | Pass | C2, C12, C13 | Pass | Pass |
| Iconography: consistent weight, real marks | C16 | Pass | C13 | C16 | Pass |
| Code quality: semantics, z-index scale, dead links | Pass | Pass | D4 fixed | Pass | Pass |
| Strategic omissions: back navigation, dead ends | Pass | Pass | D9, D10 | C17 | Pass |

Present mode passes. It hides the review bar on every state and survives navigation. Its one flaw is the phone header offset in C10.

## 7. Taste Skill output

Raw output is saved next to this report: `lint-before.txt` and `.json`, `inspect-before/` (all 25 states, no overrides), `inspect-q1-allowed/` (16 representative states after the defect fixes, with the overrides in section 8), and the defect scans `qa-scan-before` and `qa-scan-after-defects`.

* `lint.mjs` on the source: 131 FAIL and 26 WARN. Shadows 61, hairlines 19, small labels above headings 16, mono 15, gradients 11, index numbers 6, tick glyphs 3. Warnings: blur 16, stock phrases 5, outlined boxes 5. Most shadow and hairline hits are window chrome and floating layers. Section 8 lists them.
* `inspect.mjs` on the running site, before: up to 13 FAIL per state. With the allowed overrides and after the defect fixes, these remain, and each one maps to a finding: index numbers (14 states, C4 and P2), gradients (14, wallpaper allowed, but the Portal card and experience tiles are C2 and C15), hairlines (15, window chrome allowed, dividers are C1), tracked capitals (12, window titles allowed, mobile dock is C10), mono outside addresses (8, C6), text under 13px (12, C14), one 3-line heading (C10), and the tick glyph (C9). The contrast warning is gone after D1.

## 8. Skill conflicts

Rules I overrode, with `--allow` passed to the inspector for these only:

| Rule | Skill says | Kept because |
| --- | --- | --- |
| `font-count`, `mono` | Two typefaces at most, no monospace | The brief keeps Archivo for figures, Geist for text and Geist Mono for wallet addresses. Mono anywhere else is a finding (C6), not an override. |
| `palette-purple` | No violet | Violet is the brand accent, kept for progress, selection and focus. Violet used elsewhere is a finding (C9). |
| `gradient`, for the wallpaper and the primary button's glass edge only | No gradients | The wallpaper stays generated, and the glass edge is Direction A. The Portal card and experience tiles are findings (C2, C15). |
| `few-pictures`, `no-real-pictures`, `no-footage` | Four real photographs and a video | The concept is a desktop with windows. Product captures are the only imagery, and no stock or placeholder photos may come in. |
| `glass`, `shadow`, `button-fx` | No blur, no shadows at rest, flat buttons | The menu bar blur, the dock, the windows and the dialogs are the window model, and they really float. The soft layered shadows and the primary button's glass edge are Direction A. |
| `hairline`, for window title bars and the Portal sidebar edge only | No thin rules | Window chrome is the concept. Dividers inside content are findings (C1, C11). |
| `micro-label`, for window titles only | No tracked capitals | Round 5 set window titles in the wordmark style. The mobile dock labels are a finding (C10). |
| `focal-point`, `still-page`, `no-hero`, `body-size`, `covered-text` | Landing page rules: a display headline, a motion layer, 16px body, nothing over text | These are app screens. The chat window is the first screen's focus, 15px is the system's text size, windows covering the chat is the concept, and motion stays quick and quiet. |

Redesign and soft skill advice I did not follow:

* Swapping fonts, adding picsum or stock photography, and the "purple AI gradient" rule all conflict with the brief.
* Pill status badges are kept. The skill dislikes "New" and "Beta" pills, but status badges are standard in an app and are part of the round 5 badge component.
* The soft skill's eyebrow pills, double-bezel cards, floating glass navigation and fade-up on every element contradict taste v2 and Direction A, so none was used.
* The soft 12 to 16px card radius is a taste v2 "tell", but Direction A chose soft radius, so it stays.
* Legal links, cookie consent and a 404 page are out of scope for a review prototype.

## 9. Decisions needed

1. Which concept proposals to build (P1 to P5), and for P4 whether phones get the content-height sheet.
2. The duplicate review states (D9). Relabel or remove them now, or design the missing screens in round 6, including Legacy positions.
3. Sentence case on every button, including "Connect wallet" (C5).
4. Whether the copy tone changes in C15 can touch the frozen Portal copy. Each line would be shown first.

## 10. Risk

* D1 lightens every small grey label a little. That is a visible change across the whole prototype, made without approval because it was a WCAG failure.
* D5 changes the opening size of the Portal and product windows on laptop screens (1280 and below). 1440 is unchanged.
* The mocks are injected styles. Built versions will differ slightly and will be checked again in Q2.

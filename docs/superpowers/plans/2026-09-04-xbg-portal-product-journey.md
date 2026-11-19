# XBG Portal product journey implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing XBG Portal concept screens into one configuration driven, fully clickable holder journey from wallet connection through staking, missions, experiences and rewards.

**Architecture:** A typed configuration module owns all illustrative figures and content. A pure reducer owns the local demo journey, while focused React screen and dialog components render Home, Missions and Rewards inside the existing Portal window and hash router.

**Tech Stack:** React 19, TypeScript, Motion, Vitest, Playwright and the existing CSS token system.

**Spec:** `docs/superpowers/specs/2026-09-04-xbg-portal-product-journey-design.md`

## Global constraints

- Keep the existing desktop shell, landing conversation, dock, product windows, visual tokens and supplied artwork unchanged.
- Use only Home, Missions and Rewards as visible Portal destinations.
- Keep all programme terms and illustrative values in editable configuration.
- Show one global `Demo Data` label and no repeated placeholder notices.
- Use British English and no dash character in user facing copy.
- Do not imply equity, financial returns, investment access, allocations, governance rights or guaranteed referral rewards.
- Keep all interactions local to the prototype and provide Reset Demo State.
- Preserve keyboard access, reduced motion, 320px support and zero page level overflow.

---

### Task 1: Typed Portal configuration and state machine

**Files:**
- Create: `src/components/portal/config.ts`
- Create: `src/components/portal/demoState.ts`
- Create: `src/test/portalState.test.ts`

**Interfaces:**
- Produces: `PORTAL_CONFIG`, `Mission`, `Experience`, `PortalDemoState`, `PortalAction`, `createPortalState(screen)` and `portalReducer(state, action)`.
- Consumes: existing `ScreenId` review routes.

- [ ] **Step 1: Write failing reducer and calculation tests**

```ts
expect(accessForStake(5_000).name).toBe('Member')
expect(accessForStake(50_000).name).toBe('Builder')
expect(estimateSeasonReward(25_000)).toBe(1340)
expect(portalReducer(state, { type: 'mission.approve', id: 'fanbase-inbox' }).pendingRewards).toBe(750)
```

- [ ] **Step 2: Run the unit test and verify missing exports fail**

Run: `npm test -- src/test/portalState.test.ts`

Expected: FAIL because the configuration and reducer do not exist.

- [ ] **Step 3: Implement typed configuration and pure transitions**

Use three access levels, the supplied four example missions plus the referral mission, five supplied experiences, configured season dates, stake presets and immutable reducer transitions for stake, mission, reward, referral, modal, toast and reset actions.

- [ ] **Step 4: Run the focused unit test**

Run: `npm test -- src/test/portalState.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/config.ts src/components/portal/demoState.ts src/test/portalState.test.ts
git commit -m "Milestone 5: model the Portal demo journey"
```

### Task 2: Entry and staking onboarding

**Files:**
- Modify: `src/components/PortalEntry.tsx`
- Modify: `src/components/PortalWindow.tsx`
- Replace: `src/components/portal/Portal.tsx`
- Create: `src/components/portal/PortalNav.tsx`
- Create: `src/components/portal/StakeFlow.tsx`
- Modify: `src/styles/portal.css`
- Modify: `tests/portal.spec.ts`
- Modify: `tests/keyboard.spec.ts`

**Interfaces:**
- Consumes: `PortalDemoState`, `PortalAction`, `PORTAL_CONFIG`.
- Produces: disconnected entry, connected onboarding and complete stake flow inside the existing dialog.

- [ ] **Step 1: Write failing entry and staking browser tests**

```ts
await expect(page.getByRole('heading', { name: 'Enter the XBG Portal' })).toBeVisible()
await page.getByRole('button', { name: 'Connect Wallet' }).click()
await expect(page.getByRole('heading', { name: 'Stake XBG. Enter the ecosystem.' })).toBeVisible()
await page.getByLabel('Amount to stake').fill('75000')
await page.getByRole('button', { name: 'Stake XBG' }).click()
await page.getByRole('button', { name: 'Acquire XBG' }).click()
await expect(page.getByRole('button', { name: 'Confirm Stake' })).toBeVisible()
```

- [ ] **Step 2: Run the focused Playwright tests and verify the old Portal fails them**

Run: `npx playwright test tests/portal.spec.ts --grep "entry|staking|insufficient"`

Expected: FAIL on the new headings, fields and actions.

- [ ] **Step 3: Implement entry, navigation shell and StakeFlow**

Render no shell before connection. After connection initialise the configured wallet balance. Keep amount controlled, derive access and estimate from configuration, return acquisition to confirmation, confirm stake locally and route Enter Season 19 to active Home.

- [ ] **Step 4: Run focused Portal and keyboard tests**

Run: `npx playwright test tests/portal.spec.ts tests/keyboard.spec.ts --grep "entry|staking|Portal dialog"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PortalEntry.tsx src/components/PortalWindow.tsx src/components/portal/Portal.tsx src/components/portal/PortalNav.tsx src/components/portal/StakeFlow.tsx src/styles/portal.css tests/portal.spec.ts tests/keyboard.spec.ts
git commit -m "Milestone 5: rebuild Portal entry and staking"
```

### Task 3: Active Home and gated experiences

**Files:**
- Create: `src/components/portal/HomeScreen.tsx`
- Create: `src/components/portal/ExperienceGrid.tsx`
- Modify: `src/components/portal/Portal.tsx`
- Modify: `src/styles/portal.css`
- Modify: `tests/portal.spec.ts`

**Interfaces:**
- Consumes: demo state, configuration and reducer dispatch.
- Produces: ordered active Home, reusable season summary and interactive experience cards.

- [ ] **Step 1: Write failing Home hierarchy and unlock tests**

```ts
expect(await page.locator('.portal-section').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-section')))).toEqual(['season', 'mission', 'experiences', 'activity'])
await page.getByRole('button', { name: 'Stake More' }).first().click()
await page.getByRole('button', { name: 'Confirm Stake' }).click()
await expect(page.getByRole('button', { name: 'Open Product Lab' })).toBeVisible()
```

- [ ] **Step 2: Run the Home tests and verify they fail**

Run: `npx playwright test tests/portal.spec.ts --grep "active Home|experience"`

Expected: FAIL because the ordered sections and experience actions do not exist.

- [ ] **Step 3: Implement HomeScreen and ExperienceGrid**

Lead with Season 19 metrics and Stake More. Render the recommended available mission, then configured experiences with exact missing stake, followed by the latest three state events. Use a simple level bar, not the orbital graphic.

- [ ] **Step 4: Run the focused Home tests**

Run: `npx playwright test tests/portal.spec.ts --grep "active Home|experience"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/HomeScreen.tsx src/components/portal/ExperienceGrid.tsx src/components/portal/Portal.tsx src/styles/portal.css tests/portal.spec.ts
git commit -m "Milestone 5: add active Home and experiences"
```

### Task 4: Mission catalogue, proof and referral progression

**Files:**
- Create: `src/components/portal/MissionsScreen.tsx`
- Create: `src/components/portal/MissionCard.tsx`
- Create: `src/components/portal/MissionDialog.tsx`
- Modify: `src/components/portal/Portal.tsx`
- Modify: `src/styles/portal.css`
- Modify: `tests/portal.spec.ts`
- Modify: `tests/keyboard.spec.ts`

**Interfaces:**
- Consumes: configured mission objects and reducer dispatch.
- Produces: mission filters, unified mission cards, focused detail, proof form, demo approval, reward toast and referral progress.

- [ ] **Step 1: Write failing mission lifecycle tests**

```ts
await page.getByRole('button', { name: 'Start Mission' }).first().click()
await page.getByRole('button', { name: 'Accept Mission' }).click()
await page.getByRole('button', { name: 'Submit Proof' }).click()
await page.getByLabel('Evidence link').fill('https://example.com/proof')
await page.getByRole('button', { name: 'Send for Review' }).click()
await page.getByRole('button', { name: 'Approve Demo Review' }).click()
await expect(page.getByRole('status')).toContainText('Mission verified. You earned 750 XBG.')
```

- [ ] **Step 2: Run the mission tests and verify they fail**

Run: `npx playwright test tests/portal.spec.ts --grep "mission|referral"`

Expected: FAIL because filters, dialog and transitions do not exist.

- [ ] **Step 3: Implement the catalogue and modal lifecycle**

Use one Mission type for every card. The modal exposes objective, steps, eligibility, reward, deadline, verification and places. Require a link or written evidence before submission. Approval adds configured XBG to pending rewards and activity. Referral detail copies the configured demo link and advances Invited, Connected, Staked and Qualified.

- [ ] **Step 4: Run mission and keyboard tests**

Run: `npx playwright test tests/portal.spec.ts tests/keyboard.spec.ts --grep "mission|referral|focus"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/MissionsScreen.tsx src/components/portal/MissionCard.tsx src/components/portal/MissionDialog.tsx src/components/portal/Portal.tsx src/styles/portal.css tests/portal.spec.ts tests/keyboard.spec.ts
git commit -m "Milestone 5: make missions fully interactive"
```

### Task 5: Rewards, history and reset

**Files:**
- Create: `src/components/portal/RewardsScreen.tsx`
- Modify: `src/components/portal/Portal.tsx`
- Modify: `src/styles/portal.css`
- Modify: `tests/portal.spec.ts`

**Interfaces:**
- Consumes: reward totals, history, activity and reducer dispatch.
- Produces: actionable reward summary, breakdown, history, claiming and full demo reset.

- [ ] **Step 1: Write failing rewards and reset tests**

```ts
await page.getByRole('button', { name: 'Claim Rewards' }).click()
await expect(page.getByRole('status')).toContainText('500 XBG claimed')
await expect(page.getByRole('cell', { name: 'Claimed' }).first()).toBeVisible()
await page.getByRole('button', { name: 'Reset Demo State' }).click()
await expect(page.getByRole('heading', { name: 'Enter the XBG Portal' })).toBeVisible()
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npx playwright test tests/portal.spec.ts --grep "Rewards|reset"`

Expected: FAIL because claiming and reset do not exist.

- [ ] **Step 3: Implement RewardsScreen and reset**

Show estimated season reward, mission earned, pending, claimable and next distribution first. Add a configured breakdown and compact semantic table. Claiming appends history and activity. Reset closes active dialogs, clears state and returns to entry.

- [ ] **Step 4: Run focused rewards tests**

Run: `npx playwright test tests/portal.spec.ts --grep "Rewards|reset"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/RewardsScreen.tsx src/components/portal/Portal.tsx src/styles/portal.css tests/portal.spec.ts
git commit -m "Milestone 5: add actionable Portal rewards"
```

### Task 6: Responsive polish, compatibility and gate evidence

**Files:**
- Modify: `src/screens.ts`
- Modify: `src/styles/portal.css`
- Modify: `src/components/Notes.tsx`
- Modify: `tests/portal.spec.ts`
- Modify: `tests/keyboard.spec.ts`
- Modify: `tests/keyboard-record.spec.ts`
- Modify: `scripts/capture-milestone5.mjs`
- Regenerate: `review-shots/m5-*`

**Interfaces:**
- Consumes: the complete Portal flow.
- Produces: old route compatibility, desktop and mobile navigation, final evidence and review notes.

- [ ] **Step 1: Write failing responsive and compatibility tests**

```ts
await page.setViewportSize({ width: 390, height: 844 })
await expect(page.locator('.portal-tabbar').getByRole('button')).toHaveCount(3)
expect(await page.evaluate(() => document.scrollingElement?.scrollWidth)).toBe(390)
await page.goto('/#portal-network')
await expect(page.getByRole('heading', { name: /Earn more XBG/ })).toBeVisible()
```

- [ ] **Step 2: Run responsive tests and verify they fail**

Run: `npx playwright test tests/portal.spec.ts tests/keyboard.spec.ts`

Expected: FAIL on the old four item navigation and removed labels.

- [ ] **Step 3: Finish responsive CSS and update compatibility copy**

Use a three item bottom bar below 900px, single column content, wrapped mission metadata, 44px controls, visible focus and strong status contrast. Update old review routes to map to the new Home, Missions and Rewards states without exposing removed labels.

- [ ] **Step 4: Run complete verification**

Run: `npm test`

Run: `npm run test:layout`

Run: `npm run build`

Expected: all commands exit zero.

- [ ] **Step 5: Capture and inspect Milestone 5 evidence**

Run: `npm run capture:m5`

Verify 1440 by 900 and 390 by 844 screenshots, plus a 1440 by 900 load and slow scroll recording. Inspect entry, onboarding, active Home, Missions, Rewards, modal, mobile navigation and reduced motion.

- [ ] **Step 6: Commit the gate revision**

```bash
git add src tests scripts docs review-shots/m5-*
git commit -m "Milestone 5: complete the XBG holder journey"
```

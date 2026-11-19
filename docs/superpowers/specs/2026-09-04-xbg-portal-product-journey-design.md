# XBG Portal product journey design

## Scope

This revision replaces the existing concept dashboard inside the prototype Portal window. The desktop shell, homepage conversation, dock, product windows, visual tokens and supplied artwork stay unchanged. The work remains a Milestone 5 revision and does not start Milestone 6.

## Product model

The Portal has one local demo state shared by Home, Missions and Rewards. The state records wallet connection, XBG balance, stake, access level, staking flow, mission statuses, submitted proof, pending and claimable rewards, referral progress, recent activity, active modal and toast. Reset returns the Portal to the disconnected entry state.

The journey is progressive:

1. A disconnected visitor sees only the Portal proposition and Connect Wallet.
2. A connected holder with no stake sees Season 19 and one staking decision.
3. An active staker sees their season position, one recommended mission, experiences and three recent events.
4. Missions reveal additional earning paths. Higher stake levels reveal higher value missions and experiences.

## Configuration

All illustrative programme data lives in one typed configuration module. It contains season dates, the 1M XBG pool, estimated total stake, wallet balance, staking presets, access thresholds, experience requirements, mission rewards and mission metadata. Calculations consume configuration rather than duplicating figures in components.

Visible prototype data uses one global `Demo Data` badge. No visible screen repeats placeholder or approval notices. Thresholds remain typed as illustrative configuration and no copy implies financial returns, equity, allocation, governance or investment access.

## Navigation

Connected desktop navigation has Home, Missions and Rewards. Mobile uses the same three destinations in a bottom bar. Referrals are a mission type. Advanced experiences live on Home. Existing prototype hashes remain valid for review compatibility, but `portal-participate` and `portal-network` both resolve to Missions.

## Screens

### Entry

The entry is centred and contains the exact required heading, supporting sentence and Connect Wallet action. It has no application navigation or dashboard content.

### Connected onboarding

Home leads with `Stake XBG. Enter the ecosystem.` and a Season 19 staking module. The module shows the reward pool, season status, balance, controlled stake amount, estimated reward position and resulting access level. Stake XBG opens confirmation. An amount above the balance opens Acquire XBG; acquisition returns directly to confirmation. A confirmed stake exposes Enter Season 19.

### Active Home

Home orders content as season position, recommended mission, experiences and recent activity. Season position has the five requested metrics, progress and Stake More. The recommended mission has one dominant earning action. Experience cards show unlocked or locked state and the exact missing stake. Recent activity shows three rows.

### Missions

Missions has Available, In progress, In review, Completed and Locked filters. Every card uses the same mission object and displays venture, type, objective, reward, effort, deadline, slots, access, verification, status and one result focused action. A focused dialog supports acceptance, proof submission and simulated approval. Approval updates pending rewards and recent activity immediately.

Referral is one mission category. Its detail view can copy a demo referral link and progress one referred holder through Invited, Connected, Staked and Qualified. It makes no reward promise.

### Rewards

Rewards opens with earning totals and the next action. It separates seasonal, mission, referral and approved incentive sources, then shows compact distribution history. Claim Rewards moves claimable XBG into history and recent activity. View reward history scrolls or focuses the history table.

## Visual and interaction rules

The existing dark XBorg system remains. Primary text and secondary text gain stronger contrast. Interactive modules use clearer borders and state badges. Sans serif type carries navigation, headings and descriptions; monospace is limited to amounts, dates, wallet addresses and statuses. Each screen has one dominant action. Motion uses the existing Motion dependency, only transform and opacity, and respects reduced motion.

At widths below 900px the sidebar becomes a three item bottom bar, content becomes one column, mission metadata stacks, controls remain at least 44px high and no horizontal overflow is allowed.

## Verification

Vitest covers configuration calculations and reducer transitions. Playwright covers the disconnected entry, staking including insufficient balance, active Home hierarchy, experience unlocking, mission acceptance and approval, rewards claiming, referral progression, reset, keyboard focus, responsive navigation and horizontal overflow. The full existing suite, build, 1440 and 390 screenshots and a load plus slow scroll recording remain required before the gate commit.

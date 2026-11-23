import { assertPublicCopy } from './copyGuard'

// Mobbin reference board, round 5 Milestone 6. Patterns, not brands.
export type Reference = { app: string; url: string; take: string; avoid: string }
export type ReferenceArea = { area: string; references: Reference[] }

const screen = (id: string) => `https://mobbin.com/screens/${id}`

export const REFERENCES: ReferenceArea[] = [
  {
    area: 'Chat and message grouping',
    references: [
      {
        app: 'Intercom, messenger thread',
        url: screen('ef136622-155b-41a7-9f22-d2a39a34b056'),
        take: 'Consecutive bubbles from one sender stack tightly and shrink to their text.',
        avoid: 'Pastel fills that give each side of the thread a different colour.',
      },
      {
        app: 'Intercom, demo message with attachment',
        url: screen('f7a70d0e-bb91-4027-a451-d086766ed416'),
        take: 'A rich attachment sits inside the thread at bubble width, with an inline link under it.',
        avoid: 'The busy three pane inbox around the thread.',
      },
      {
        app: 'WhatsApp, chat thread',
        url: screen('ff7ec209-6c71-4eef-9df6-c5667fd27a49'),
        take: 'Grouped bubbles change corner shape at the start and end of a run.',
        avoid: 'Patterned wallpaper behind the thread and ticks on every message.',
      },
      {
        app: 'WhatsApp, thread with system notes',
        url: screen('f95b630a-93ca-437f-825e-86235a109257'),
        take: 'Date and system notes sit centred and quiet, so the bubbles carry the voice.',
        avoid: 'Tinted system banners inside the conversation.',
      },
    ],
  },
  {
    area: 'Wallet control and account menu',
    references: [
      {
        app: 'Uniswap, connected header',
        url: screen('fd3c850b-3944-47f9-a274-5d7083b1c785'),
        take: 'The connected state is one compact chip in the header showing the short address.',
        avoid: 'Bright brand colour on secondary actions.',
      },
      {
        app: 'Base, wallet settings',
        url: screen('a41a4a0d-d615-4168-bb13-1d5f529d3a26'),
        take: 'The short address acts as the account name, with plain rows under it.',
        avoid: 'A separate danger zone heading for a single sign out.',
      },
      {
        app: 'Base, select account',
        url: screen('0845c520-3a4f-4557-8431-285ab7adfcbc'),
        take: 'One account row with a quiet check mark and one sign out action.',
        avoid: 'A full modal for what a small menu can do.',
      },
      {
        app: 'Laravel Cloud, connection menu',
        url: screen('ec08f97b-89fa-4bfa-a6b1-100c4bb488ed'),
        take: 'A small dark menu anchored to its trigger, with icon rows for manage and disconnect.',
        avoid: 'An extra three dot button to reach it.',
      },
    ],
  },
  {
    area: 'Premium figures and dashboards',
    references: [
      {
        app: 'Mercury, home',
        url: screen('dbf9eb63-dcfe-4876-965a-e8a6d8702092'),
        take: 'The balance is the largest thing on the page, with small cents and plenty of room.',
        avoid: 'A row of action pills competing with the figure.',
      },
      {
        app: 'Mercury, transactions summary',
        url: screen('f964f8c4-c630-406a-b599-585edf376533'),
        take: 'Summary figures in one row, calm labels above, no boxes around them.',
        avoid: 'The filter bar density, which suits accounting teams rather than holders.',
      },
      {
        app: 'Copilot Money, dark dashboard',
        url: screen('1bfa784d-99eb-4850-88e2-4064d4d06452'),
        take: 'Dark cards separated by tone rather than borders.',
        avoid: 'Red and green used on almost every figure.',
      },
      {
        app: 'Revolut, home',
        url: screen('e93d0c63-dfcf-4eb2-bd22-0be63f571215'),
        take: 'One large centred figure with a single quiet button under it.',
        avoid: 'The saturated gradient behind the figure.',
      },
      {
        app: 'Supabase, project overview',
        url: screen('782baf2b-1d87-4a1c-a461-a87acc585ba9'),
        take: 'Small mono labels over figures read as data, not decoration.',
        avoid: 'Bright green charts.',
      },
    ],
  },
  {
    area: 'Staking and confirmation flows',
    references: [
      {
        app: 'Base, transaction review',
        url: screen('5c5a1976-d22a-451e-a95b-0a9812d92c0e'),
        take: 'The review lists what changes, the wallet and the fee as right aligned rows, then Cancel and Confirm.',
        avoid: 'An information banner above the one thing that matters.',
      },
      {
        app: 'Kraken, amount entry',
        url: screen('e8d8c446-5784-4bc5-9148-1fbd01297282'),
        take: 'The amount is the hero of the screen, very large, with its unit beside it.',
        avoid: 'A full number pad on desktop.',
      },
      {
        app: 'Kraken, confirm details',
        url: screen('f9dff7cc-2567-46f4-abb4-1e5ec8a78ef2'),
        take: 'One confirm button pinned under a calm summary. Addresses keep their case.',
        avoid: 'Gradient buttons.',
      },
      {
        app: 'Quicken, add holding',
        url: screen('598af85b-b707-4672-b8d3-2d740d46fef7'),
        take: 'The computed result sits in a tinted strip under the inputs.',
        avoid: 'Floating labels squeezed inside small fields.',
      },
      {
        app: 'Coinbase, home',
        url: screen('f0ad89db-90e1-4c76-a58a-c6941901489b'),
        take: 'Balances and staking in one calm table with a clear way to act on each row.',
        avoid: 'Yield percentages beside every line. We never show APY.',
      },
    ],
  },
  {
    area: 'Window chrome, menu bar and overall polish',
    references: [
      {
        app: 'Linear, issues',
        url: screen('fd1b4d88-f021-49a3-98af-4cd3a87e1d29'),
        take: 'A thin header, generous space and one surface tone per level.',
        avoid: 'The light theme itself. We take the proportions.',
      },
      {
        app: 'Vercel, projects',
        url: screen('ee9c9ca1-d199-4d29-8532-eec6ed7b5ca0'),
        take: 'One solid primary button and quiet secondary buttons, used the same way everywhere.',
        avoid: 'Several status colours inside one card.',
      },
      {
        app: 'Vercel, dark overview',
        url: screen('ed0068c5-ccd5-40f8-8221-6676ace3d749'),
        take: 'Dark surfaces lifted by one step of tone and a hairline.',
        avoid: 'Decorative dot maps.',
      },
      {
        app: 'Supabase, copy menu',
        url: screen('a29c87db-9bd4-4c63-993e-6a974a8dbe30'),
        take: 'A small popover anchored to its trigger, closing on selection.',
        avoid: 'Mono type used for every label.',
      },
    ],
  },
  {
    area: 'Lists, filters and mission cards',
    references: [
      {
        app: 'Linear, grouped issues',
        url: screen('ef923b0e-9a40-4fdd-80f2-f3aafb4f36ce'),
        take: 'Grouped lists with a count and quiet status marks.',
        avoid: 'Dense metadata chips on every row.',
      },
      {
        app: 'Airbnb, choice cards',
        url: screen('f99f5466-e3f5-4ade-a5d6-8d1f840f6e23'),
        take: 'Selectable cards with a title, one line of detail and a single selected state.',
        avoid: 'A heavy black outline on the chosen card.',
      },
      {
        app: 'Airbnb, filters sheet',
        url: screen('dad4c99d-a212-419f-a44f-2f373d2f83db'),
        take: 'Filters in a sheet with Clear all and one primary action.',
        avoid: 'Long checkbox lists.',
      },
      {
        app: 'Vercel, project cards',
        url: screen('e356ab80-77ca-433e-8bc5-b047fb419e69'),
        take: 'Cards with a mark, a name, one line and quiet meta on a calm grid.',
        avoid: 'Icon buttons in every card corner.',
      },
    ],
  },
  {
    area: 'Modals and toasts',
    references: [
      {
        app: 'Klaviyo, success modal',
        url: screen('1bb388bb-401f-425e-afa1-96e8b3290f40'),
        take: 'A success state with one icon, one line and one button.',
        avoid: 'The same heading repeated in the title bar and the body.',
      },
      {
        app: 'Shopify, completion modal',
        url: screen('8a523434-0a78-4e51-b2d2-54f0d126426d'),
        take: 'A quiet toast under the modal confirms the copy action.',
        avoid: 'A bright green success banner.',
      },
      {
        app: 'Cofounder, connected toast',
        url: screen('b47fe7f8-84ae-49ac-a380-51ef177a216e'),
        take: 'A small toast in the corner confirms the action without covering content.',
        avoid: 'A tall modal that is mostly empty.',
      },
      {
        app: 'Ferndesk, ready to audit',
        url: screen('fe1753cb-56f1-4810-a3f7-0183ec9fb802'),
        take: 'Summary rows, then one full width primary button.',
        avoid: 'Blurring the background at full strength.',
      },
    ],
  },
  {
    area: 'Mobile bottom navigation',
    references: [
      {
        app: 'Revolut, home',
        url: screen('dad40228-042e-4bff-abf4-6c8cee4d9bcb'),
        take: 'A translucent tab bar where the active item is simply full ink.',
        avoid: 'Five tabs. The Portal needs three.',
      },
      {
        app: 'Revolut, crypto',
        url: screen('d13cd4ee-83a5-4b25-bc6f-037f141894be'),
        take: 'Content scrolls behind a blurred tab bar and never ends up hidden under it.',
        avoid: 'Saturated gradients.',
      },
      {
        app: 'MoonPay, home',
        url: screen('ef31848d-f96f-4b4d-ae86-499846240535'),
        take: 'A large figure at the top and the main actions pinned above the home indicator.',
        avoid: 'Two pill buttons that look identical.',
      },
      {
        app: 'Lloyds, net worth',
        url: screen('fd0be564-d70d-4755-af2c-84f6ade7b032'),
        take: 'Tab bar icons with clear labels under each one.',
        avoid: 'A bright green primary bar.',
      },
    ],
  },
]

for (const area of REFERENCES) {
  assertPublicCopy(area.area)
  for (const reference of area.references) {
    assertPublicCopy(reference.app)
    assertPublicCopy(reference.take)
    assertPublicCopy(reference.avoid)
  }
}

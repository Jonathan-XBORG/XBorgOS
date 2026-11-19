export default function Notes() {
  return (
    <article className="system notes">
      <header className="sys-head">
        <p className="sys-kicker">Review</p>
        <h1>Design notes</h1>
        <p className="sys-lead">Throwaway prototype. Production xborg.com was not changed.</p>
      </header>

      <h2>Settled product decisions</h2>
      <ul>
        <li>XBorg is an AI startup studio. XBG is the token.</li>
        <li>The chat conversation is the narrative. The workspace is the stage.</li>
        <li>Stake follows the live xborg.com/earn programme: pledge XBG for the season while it stays in the wallet, meet one eligibility option, and receive a share of the pool at season end. Closed staking positions sit in their own view.</li>
        <li>Earn is a separate app with no content yet. Its product is defined later.</li>
        <li>British English. No dash character in public copy.</li>
        <li>The Stake and Earn dock tiles open their windows inside the persistent desktop workspace.</li>
        <li>Stake gives holders one action at a time: connect, verify, pledge or buy XBG.</li>
      </ul>

      <h2>Visual decisions, round 5</h2>
      <ul>
        <li>Direction A, Calm, chosen on 24 September 2026. The #system screen is the living sheet.</li>
        <li>Soft radius, tonal surfaces and soft layered shadows. The chamfer survives only on the X mark tile.</li>
        <li>One button family: primary, secondary and quiet, in 28, 36 and 44 heights.</li>
        <li>Main calls to action carry a subtle glass edge: a translucent ring a few pixels outside the button.</li>
        <li>Violet marks progress, selection and focus. It is not a button fill.</li>
        <li>Seven type sizes. Archivo for display and figures, Geist for text, Geist Mono for wallet addresses only.</li>
        <li>No brackets, no LIVE label and no HUD ticks. Window titles use the wordmark style.</li>
        <li>Bubbles shrink to their text and group under one X mark. Product names in messages open their window.</li>
        <li>The first beat rests at the foot of the chat window under a large X mark, as a conversation opens.</li>
        <li>One wallet state for the whole prototype. Connect Wallet opens Stake at its visitor view.</li>
        <li>Product, Stake and Earn windows move by the title bar, resize from every edge and corner, and maximise.</li>
        <li>Only the hovered dock tile magnifies. Focus rings show for keyboard users only.</li>
        <li>On mobile the dock is a solid bottom bar and the chat ends above it.</li>
        <li>Present mode, the query flag present=1, hides the review bar again and survives navigation.</li>
        <li>Stake keeps one quiet Demo Data label in its title bar. The demo reset sits at the foot of the sidebar.</li>
        <li>Each screen has one primary button.</li>
        <li>The visitor view opens as a narrower window and grows into the full Stake app once the wallet connects.</li>
        <li>Every style value comes from a token. A unit test enforces it and the design system screen lists the exceptions.</li>
      </ul>

      <h2>Prototype data and assets</h2>
      <ul>
        <li>The desktop stage uses no photographic wallpaper.</li>
        <li>
          The round 2 wallpaper photograph shows laptops with the Apple logo. It must not return as it is.
        </li>
        <li>
          Round 5 adds two placeholder assets for the candidate directions: an X mark glyph for sender marks and a
          faint X mark field for the Direction B wallpaper. Both are drawn from the existing mark.
        </li>
        <li>Stake uses one global Demo Data label for illustrative figures and thresholds.</li>
        <li>Access thresholds remain editable configuration until programme approval.</li>
        <li>Referral rewards remain unavailable until programme terms are approved.</li>
        <li>
          Product captures show each product's own public page claims as of 2 September 2026. They are not
          XBorg claims.
        </li>
      </ul>

      <h2>Assets still required</h2>
      <ul>
        <li>Authenticated Propr trading interface still, if the public homepage is not enough.</li>
        <li>Final approved product marks for Propr, FanBase and Trigr.</li>
      </ul>

      <h2>Production concerns</h2>
      <ul>
        <li>The Propr revenue line on the XBorg site needs a refreshed figure or a date before production.</li>
        <li>No wallet, contract or live data in this prototype.</li>
        <li>Referral benefits and final access thresholds need product and legal approval.</li>
      </ul>

      <h2>Design system extensions</h2>
      <ul>
        <li>The wordmark XBORG is uppercase, as specified for the top bar, in addition to mono labels and dock product names.</li>
        <li>The XBorg window has no close control. It is the main window and is never closed.</li>
        <li>Conversation bottom padding is 20vh so the Stake card can rest in the lower half at scroll end.</li>
        <li>Present mode is the query flag present=1, combinable with any hash.</li>
        <li>The top bar tile uses the XBorg X mark from the round 2 wordmark, not a house glyph.</li>
        <li>The compact mobile review bar sits above the launcher so it does not cover a sheet title.</li>
        <li>Focused chamfered controls use an inset violet line where clipping would hide an outer ring.</li>
        <li>Wallet addresses keep hexadecimal case even inside mono interface labels.</li>
        <li>The desktop header uses a roomier 44px height for the brand and wallet state.</li>
        <li>The first desktop beat fills one window body so Beat 2 begins only after scroll.</li>
        <li>Product, Stake and Earn window scale origins use the matching dock tile position.</li>
        <li>The mobile opening and conversation share the window body as the only page scroll container.</li>
      </ul>
    </article>
  )
}

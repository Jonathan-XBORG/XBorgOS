import { REFERENCES } from '../references'

export default function References() {
  return (
    <article className="system references" data-screen="references">
      <header className="sys-head">
        <p className="sys-kicker">XBorg design system</p>
        <h1>Mobbin references</h1>
        <p className="sys-lead">
          Patterns collected before the design system was drawn. For each reference, what we take and what we
          avoid.
        </p>
      </header>
      {REFERENCES.map((area) => (
        <section key={area.area} className="sys-section">
          <header className="sys-section-head">
            <h2>{area.area}</h2>
          </header>
          <ul className="ref-list">
            {area.references.map((reference) => (
              <li key={reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  {reference.app}
                </a>
                <p>
                  <span>Take</span>
                  {reference.take}
                </p>
                <p>
                  <span>Avoid</span>
                  {reference.avoid}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}

import { OPEN_STAKE_LABEL } from '../conversation'
import { IconArrow, IconMark } from './Icons'

export default function MobileHero({ onOpenStake }: { onOpenStake: () => void }) {
  return (
    <section className="mobile-hero">
      <div className="mobile-hero-brand">
        <span className="topbar-mark">
          <IconMark />
        </span>
        <span className="wordmark">XBORG</span>
      </div>
      <h1 className="hero-display">
        <span className="w500">An AI</span>
        <span className="w800">startup studio.</span>
      </h1>
      <p className="lead">We help small teams build and grow software companies.</p>
      <span className="btn-wrap">
        <button type="button" className="btn btn-primary" data-focus="open-stake-mobile" onClick={onOpenStake}>
          {OPEN_STAKE_LABEL}
          <IconArrow />
        </button>
      </span>
    </section>
  )
}

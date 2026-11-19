import { SCREEN_GROUPS, SCREENS, type ScreenId } from '../screens'

export default function ReviewBar({
  screen,
  onGo,
  onPrevious,
}: {
  screen: ScreenId
  onGo: (id: ScreenId) => void
  onPrevious: () => void
}) {
  return (
    <div className="review">
      <span className="mark">Prototype</span>
      <button type="button" onClick={onPrevious} aria-label="Previous screen">
        Prev
      </button>
      <select
        value={screen}
        aria-label="Review screen"
        onChange={(event) => onGo(event.target.value as ScreenId)}
      >
        {SCREEN_GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {SCREENS.filter((s) => s.group === group).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

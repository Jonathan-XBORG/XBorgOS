// Focus rings show for keyboard users only. Programmatic focus on load or
// after a click must not draw a ring, so the root records the last input type.
export function trackInputModality() {
  const root = document.documentElement
  root.dataset.input = 'pointer'
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab' || event.key.startsWith('Arrow') || event.key === 'Enter' || event.key === ' ') {
        root.dataset.input = 'keyboard'
      }
    },
    true,
  )
  window.addEventListener('pointerdown', () => (root.dataset.input = 'pointer'), true)
}

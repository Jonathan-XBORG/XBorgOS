import { afterEach } from 'vitest'

afterEach(() => {
  window.location.hash = ''
  window.history.replaceState(null, '', '/')
})

import { assertPublicCopy } from './copyGuard'

// Style values allowed outside tokens.css. The #system screen lists these,
// and src/test/tokens-only.test.ts enforces that nothing else slips through.
export const TOKEN_EXCEPTIONS: { file: string; match: RegExp; reason: string }[] = [
  {
    file: 'components.css',
    match: /mask: linear-gradient\(#000 0 0\)/,
    reason: 'The glass edge mask uses solid black as a shape. It is never a visible colour.',
  },
  {
    file: 'components.css',
    match: /background: rgb\(0 0 0 \/ 60%\)/,
    reason: 'The capture label keeps a 60 percent black backing so it stays legible over any product image.',
  },
]

for (const exception of TOKEN_EXCEPTIONS) assertPublicCopy(exception.reason)

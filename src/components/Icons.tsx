import type { ReactNode } from 'react'

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {children}
    </svg>
  )
}

export function IconPortal() {
  return (
    <Glyph>
      <rect x="5" y="5" width="14" height="14" />
      <path d="M9 12h6M12 9v6" />
    </Glyph>
  )
}

// Earn's dock glyph: a solid coin with a rising arrow cut through it, the same
// filled weight as the product marks beside it. Earn has no product yet.
export function IconEarn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Zm0 4.6-5 5 1.6 1.6 2.3-2.3v5.9h2.2v-5.9l2.3 2.3 1.6-1.6-5-5Z"
      />
    </svg>
  )
}

export function IconMark() {
  return (
    <svg viewBox="0 0 19 20" fill="currentColor" aria-hidden="true">
      <path d="M18.5417 0.0582656C18.731 -0.0849702 18.9999 0.0524626 18.9999 0.292448V5.10203C18.9999 5.37711 18.8729 5.6362 18.6568 5.80162L13.858 9.47537C13.7088 9.58961 13.527 9.65139 13.3403 9.65139H5.66101C5.47428 9.65139 5.29261 9.58964 5.1434 9.47544L0.343259 5.80162C0.127128 5.6362 0 5.37708 0 5.10196V0.292396C0 0.0524202 0.268898 -0.0850138 0.458213 0.0582027L9.32941 6.76924C9.43107 6.84614 9.57028 6.84614 9.67193 6.76923L18.5417 0.0582656Z" />
      <path d="M18.5418 19.9418C18.7311 20.085 19 19.9475 19 19.7076V14.8979C19 14.6228 18.8729 14.3637 18.6568 14.1983L13.858 10.5246C13.7088 10.4103 13.5271 10.3485 13.3403 10.3485H5.66106C5.47433 10.3485 5.29266 10.4103 5.14345 10.5245L0.343311 14.1983C0.127179 14.3637 5.15088e-05 14.6228 5.15088e-05 14.898V19.7076C5.15088e-05 19.9476 0.268924 20.085 0.458243 19.9418L9.32948 13.2321C9.43113 13.1552 9.57032 13.1552 9.67196 13.2321L18.5418 19.9418Z" />
    </svg>
  )
}

export function IconArrow() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

export function IconCopy() {
  return (
    <Glyph>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2" />
    </Glyph>
  )
}

export function IconCheck() {
  return (
    <Glyph>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Glyph>
  )
}

export function IconDisconnect() {
  return (
    <Glyph>
      <path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9" />
    </Glyph>
  )
}

export function IconOpen() {
  return (
    <Glyph>
      <path d="M7 17 17 7M9 7h8v8" />
    </Glyph>
  )
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  )
}

export function IconBack() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M13 8H3M7 4 3 8l4 4" />
    </svg>
  )
}

export function IconBubble() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 3.5h10a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1H7l-3 2.5V11H3a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

import { describe, expect, it } from 'vitest'
import {
  SCREEN_ALIASES,
  SCREEN_GROUPS,
  SCREENS,
  STAKE_SCREENS,
  hrefFor,
  isLandingScreen,
  isStakeScreen,
  parseHash,
} from '../screens'

describe('parseHash', () => {
  it('maps an empty hash to workspace', () => {
    window.location.hash = ''
    expect(parseHash()).toBe('workspace')
  })

  it('maps unknown hashes to workspace', () => {
    window.location.hash = '#not-a-screen'
    expect(parseHash()).toBe('workspace')
  })

  it('reads every registered screen id', () => {
    for (const { id } of SCREENS) {
      window.location.hash = `#${id}`
      expect(parseHash()).toBe(id)
    }
  })

  it('keeps every XBG Portal review link working through an alias', () => {
    const old = [
      'portal-entry',
      'portal-no-xbg',
      'portal-unstaked',
      'portal-stake-amount',
      'portal-stake-preview',
      'portal-stake-pending',
      'portal-stake-done',
      'portal-home',
      'portal-home-quiet',
      'portal-near-level',
      'portal-participate',
      'portal-participate-empty',
      'portal-network',
      'portal-rewards',
      'portal-season-done',
      'portal-legacy',
      'portal-mobile-entry',
      'portal-mobile-home',
    ]
    for (const id of old) {
      window.location.hash = `#${id}`
      const resolved = parseHash()
      expect(isStakeScreen(resolved), id).toBe(true)
      expect(resolved).toBe(SCREEN_ALIASES[id])
    }
  })
})

describe('screen hrefs', () => {
  it('builds hash navigation without a mode query', () => {
    expect(hrefFor('stake-active')).toBe('/#stake-active')
    expect(hrefFor('workspace')).toBe('/#workspace')
  })
})

describe('review registry', () => {
  it('groups every screen for the review selector', () => {
    for (const screen of SCREENS) expect(SCREEN_GROUPS).toContain(screen.group)
  })

  it('registers the Stake states and the Earn app', () => {
    expect(STAKE_SCREENS.length).toBeGreaterThanOrEqual(30)
    expect(SCREENS.map((s) => s.id)).toContain('earn')
    expect(new Set(SCREENS.map((s) => s.label)).size).toBe(SCREENS.length)
  })
})

describe('workspace shell', () => {
  it('contains landing, Stake and Earn routes', () => {
    expect(isLandingScreen('workspace')).toBe(true)
    expect(isLandingScreen('propr')).toBe(true)
    expect(isLandingScreen('stake-entry')).toBe(true)
    expect(isLandingScreen('stake-active')).toBe(true)
    expect(isLandingScreen('earn')).toBe(true)
    expect(isLandingScreen('notes')).toBe(false)
  })
})

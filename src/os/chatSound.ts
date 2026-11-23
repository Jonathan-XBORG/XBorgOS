// Small message sounds, synthesised with Web Audio (no audio files).
// Browsers only allow sound after the visitor has interacted with the page,
// so messages that arrive before the first click or key press stay silent.

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

// Unlock the audio context on the first gesture.
if (typeof window !== 'undefined') {
  const unlock = () => {
    const a = audio()
    if (a && a.state === 'suspended') a.resume().catch(() => {})
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

function tone(a: AudioContext, freq: number, to: number, start: number, length: number, gain: number, type: OscillatorType = 'sine') {
  const osc = a.createOscillator()
  const amp = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  osc.frequency.exponentialRampToValueAtTime(to, start + length)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(amp).connect(a.destination)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

// 'in': a soft two note pop for Gauthier's messages. 'out': a short higher
// tick when the visitor sends one.
export function playMessageSound(kind: 'in' | 'out') {
  const a = audio()
  if (!a || a.state !== 'running') return
  const t = a.currentTime + 0.01
  if (kind === 'in') {
    tone(a, 740, 760, t, 0.09, 0.07)
    tone(a, 1110, 1130, t + 0.07, 0.14, 0.06)
  } else {
    tone(a, 1320, 980, t, 0.08, 0.045)
  }
}

// Retro terminal beeps for the CRT mode (square waves, very short).
export function beep(kind: 'on' | 'off' | 'click') {
  const a = audio()
  if (!a || a.state !== 'running') return
  const t = a.currentTime + 0.01
  if (kind === 'on') {
    tone(a, 440, 440, t, 0.08, 0.03, 'square')
    tone(a, 880, 880, t + 0.09, 0.12, 0.03, 'square')
  } else if (kind === 'off') {
    tone(a, 880, 880, t, 0.08, 0.03, 'square')
    tone(a, 330, 330, t + 0.09, 0.14, 0.03, 'square')
  } else {
    tone(a, 1200, 1200, t, 0.025, 0.018, 'square')
  }
}

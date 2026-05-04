import type { ParticleTier } from '../types/game'

let _ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

function resume(ctx: AudioContext) {
  if (ctx.state === 'suspended') ctx.resume()
}

// "띠" — 아주 짧은 앞꾸밈음
function ti(ctx: AudioContext, freq: number, vol: number, startTime: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.055)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + 0.06)
}

// "링" — 배음을 가진 울리는 주음
function ring(ctx: AudioContext, freq: number, vol: number, decay: number, startTime: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + decay)

  // 배음
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = freq * 2.76
  gain2.gain.setValueAtTime(vol * 0.3, startTime)
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + decay * 0.5)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(startTime)
  osc2.stop(startTime + decay)
}

// "띠링" = ti(짧음) → ring(울림), 30ms 간격
function diring(tiFreq: number, ringFreq: number, vol: number, decay: number, offsetMs = 0) {
  const ctx = getCtx()
  resume(ctx)
  const base = ctx.currentTime + offsetMs / 1000
  ti(ctx, tiFreq, vol * 0.6, base)
  ring(ctx, ringFreq, vol, decay, base + 0.03)
}

// 카운트다운 틱: 숫자마다 음높이를 높여서 긴장감 부여
export function playCountdownSound(_count: number) {
  const ctx = getCtx()
  resume(ctx)
  const now = ctx.currentTime
  // 3→낮음, 2→중간, 1→높음
  const freq = 660
  const vol  = 0.40

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.2)
}

export function playPopSound(tier: ParticleTier) {
  try {
    if (tier === 'big') {
      diring(2200, 2800, 0.55, 0.35)
      diring(2600, 3300, 0.30, 0.25, 90)
    } else if (tier === 'combo') {
      diring(1900, 2400, 0.45, 0.28)
    } else {
      diring(1600, 2000, 0.35, 0.22)
    }
  } catch {}
}

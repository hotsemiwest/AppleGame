import type { ParticleTier } from '../types/game'

let _ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

// 버튼 클릭 등 user gesture 핸들러에서 동기적으로 호출 — context를 미리 unlock
export function unlockAudio() {
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
}

function withCtx(fn: (ctx: AudioContext) => void) {
  const ctx = getCtx()
  if (ctx.state === 'running') {
    fn(ctx)
  } else {
    ctx.resume().then(() => fn(ctx)).catch(() => {})
  }
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
  withCtx(ctx => {
    const base = ctx.currentTime + offsetMs / 1000
    ti(ctx, tiFreq, vol * 0.6, base)
    ring(ctx, ringFreq, vol, decay, base + 0.03)
  })
}

// 카운트다운 틱: 숫자마다 음높이를 높여서 긴장감 부여
export function playCountdownSound(_count: number) {
  withCtx(ctx => {
    const now = ctx.currentTime
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
  })
}

export function playSwordSlashSound(tier: ParticleTier) {
  withCtx(ctx => {
    const now = ctx.currentTime
    const vol = tier === 'big' ? 0.52 : tier === 'combo' ? 0.44 : 0.36

    // 칼날 휘두르는 whoosh: 고음→저음 sawtooth 스윕
    const whoosh = ctx.createOscillator()
    const whooshFlt = ctx.createBiquadFilter()
    const whooshGain = ctx.createGain()
    whoosh.type = 'sawtooth'
    whoosh.frequency.setValueAtTime(1300, now)
    whoosh.frequency.exponentialRampToValueAtTime(160, now + 0.12)
    whooshFlt.type = 'bandpass'
    whooshFlt.frequency.value = 850
    whooshFlt.Q.value = 1.8
    whooshGain.gain.setValueAtTime(vol, now)
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    whoosh.connect(whooshFlt)
    whooshFlt.connect(whooshGain)
    whooshGain.connect(ctx.destination)
    whoosh.start(now)
    whoosh.stop(now + 0.16)

    // 충격음: 둔탁한 square wave 하강
    const thud = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thud.type = 'square'
    thud.frequency.setValueAtTime(tier === 'big' ? 190 : 130, now + 0.09)
    thud.frequency.exponentialRampToValueAtTime(48, now + 0.30)
    thudGain.gain.setValueAtTime(vol * 0.55, now + 0.09)
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
    thud.connect(thudGain)
    thudGain.connect(ctx.destination)
    thud.start(now + 0.09)
    thud.stop(now + 0.34)

    // combo/big: 금속 울림 shimmer
    if (tier !== 'normal') {
      const shimmer = ctx.createOscillator()
      const shimmerGain = ctx.createGain()
      shimmer.type = 'sine'
      shimmer.frequency.value = tier === 'big' ? 3600 : 2900
      shimmerGain.gain.setValueAtTime(0, now)
      shimmerGain.gain.linearRampToValueAtTime(vol * 0.18, now + 0.05)
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      shimmer.connect(shimmerGain)
      shimmerGain.connect(ctx.destination)
      shimmer.start(now)
      shimmer.stop(now + 0.28)
    }
  })
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

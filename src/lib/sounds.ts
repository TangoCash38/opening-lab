import { getBoardTheme } from "@/lib/board-theme";
let audioCtx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/** Resume AudioContext on a user gesture so later thumps are not silent. */
export function resumeAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function soundPickupArcade(ctx: AudioContext) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(1320, t + 0.05);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.08);
}

function soundPickupWood(ctx: AudioContext) {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.07);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1400;
  bp.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.028, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  src.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.07);
}

/** Pickup — wood scrape, or arcade blip only on Arcade theme. */
export function soundPickup() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (getBoardTheme() === "arcade") soundPickupArcade(ctx);
    else soundPickupWood(ctx);
  } catch {
    /* ignore audio failures */
  }
}

function soundMoveArcade(ctx: AudioContext) {
  const t = ctx.currentTime;
  const beep = (freq: number, start: number, dur: number, vol: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(freq, t + start);
    g.gain.setValueAtTime(0.0001, t + start);
    g.gain.exponentialRampToValueAtTime(vol, t + start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t + start);
    o.stop(t + start + dur + 0.01);
  };
  // Coin / land chiptune: short ascending blip-blip
  beep(523, 0, 0.06, 0.07);
  beep(784, 0.05, 0.08, 0.09);
  beep(1046, 0.11, 0.1, 0.06);
}

function soundMoveWood(ctx: AudioContext) {
  const t = ctx.currentTime;
  const thump = (freq: number, vol: number, dur: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.01);
  };
  thump(85, 0.18, 0.16);
  thump(160, 0.08, 0.09);

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.06);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 280;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.09, t + 0.003);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
  src.connect(lp);
  lp.connect(ng);
  ng.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.06);
}

/** Land — board thud, or arcade coin-blip only on Arcade theme. */
export function soundMove() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (getBoardTheme() === "arcade") soundMoveArcade(ctx);
    else soundMoveWood(ctx);
  } catch {
    /* ignore audio failures */
  }
}

/** Arcade-only: taken piece zap. No-op on other themes. */
export function soundCapture() {
  try {
    if (getBoardTheme() !== "arcade") return;
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.085, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.22);
    // Noise burst
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.12);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.12);
  } catch {
    /* ignore */
  }
}

export function soundSelect() {
  soundPickup();
}

export function soundOk() {
  /* Land already thumps. No extra chime. */
}

/** Dull muted knock — not a toy buzzer. */
export function soundBad() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.12);

    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.05);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.018, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(lp);
    lp.connect(ng);
    ng.connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.05);
  } catch {
    /* ignore audio failures */
  }
}

/** Short pleasant win arpeggio — clean Test pass celebration only. */
export function soundWin() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Soft rising G-major: G4–B4–D5–G5 (~0.85s), sine only — not a toy buzzer.
    const notes = [
      { f: 392, at: 0, dur: 0.22, vol: 0.055 },
      { f: 494, at: 0.12, dur: 0.22, vol: 0.05 },
      { f: 587, at: 0.24, dur: 0.26, vol: 0.048 },
      { f: 784, at: 0.4, dur: 0.42, vol: 0.04 },
    ];
    for (const n of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(n.f, t + n.at);
      g.gain.setValueAtTime(0.0001, t + n.at);
      g.gain.exponentialRampToValueAtTime(n.vol, t + n.at + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.at + n.dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t + n.at);
      o.stop(t + n.at + n.dur + 0.02);
    }
  } catch {
    /* ignore audio failures */
  }
}

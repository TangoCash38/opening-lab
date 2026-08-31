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

/** Short quiet wood scrape — pickup / drag start. Filtered noise, not a beep. */
export function soundPickup() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
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
  } catch {
    /* ignore audio failures */
  }
}

/** Low board thump on a legal land (click-move or drop). Louder than the scrape. */
export function soundMove() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
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
  } catch {
    /* ignore audio failures */
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

/** Win arpeggio dropped — clean Test still goes green on the line list. */
export function soundWin() {
  /* quiet */
}

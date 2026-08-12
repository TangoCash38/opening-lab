let audioCtx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  return audioCtx;
}

function beep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.08) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur);
  } catch {
    /* ignore audio failures */
  }
}

export function soundSelect() {
  beep(520, 0.06, "triangle", 0.06);
}
export function soundMove() {
  beep(380, 0.07, "sine", 0.07);
  beep(220, 0.09, "sine", 0.04);
}
export function soundOk() {
  beep(660, 0.08, "sine", 0.07);
  setTimeout(() => beep(880, 0.1, "sine", 0.06), 70);
}
export function soundBad() {
  beep(180, 0.15, "sawtooth", 0.05);
}
export function soundWin() {
  [523, 659, 784, 1046].forEach((f, i) =>
    setTimeout(() => beep(f, 0.18, "sine", 0.07), i * 120),
  );
}

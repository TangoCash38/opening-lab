/** Soft wooden chimes. The context is created on Begin, never at import. No voice. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let blocked = false;

function context(): AudioContext | null {
  if (blocked || typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ctx.destination);
    } catch {
      blocked = true;
      ctx = null;
      master = null;
      return null;
    }
  }
  return ctx;
}

export function unlockAudio(): void {
  try {
    const audio = context();
    if (audio && audio.state === "suspended") void audio.resume().catch(() => {});
  } catch {
    blocked = true;
  }
}

export function resumeAudio(): void {
  try {
    if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.85, ctx.currentTime, 0.02);
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  return muted;
}

function tone(freq: number, dur: number, gain: number, type: OscillatorType): void {
  if (muted) return;
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.62), t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  } catch {
    /* a failed chime must not cancel the round */
  }
}

/** A bright ding on the flash. The landing square sits higher than the piece's square. */
export function playWatch(index: number): void {
  const ply = Math.floor(index / 2);
  const fromSquare = index % 2 === 0;
  const root = ply % 2 === 0 ? 659 : 523;
  const freq = fromSquare ? root : root * 1.26;
  tone(freq, 0.1, 0.32, "sine");
  tone(freq * 2.02, 0.06, 0.1, "triangle");
}

export function playHit(): void {
  tone(880 * (1 + (Math.random() - 0.5) * 0.02), 0.12, 0.12, "sine");
}

export function playMiss(): void {
  tone(146, 0.28, 0.16, "triangle");
  tone(92, 0.34, 0.1, "sine");
}

export function playWin(): void {
  if (muted || !ctx || !master) return;
  try {
    const audio = ctx;
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const t = audio.currentTime + i * 0.12;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(amp);
      amp.connect(master!);
      osc.start(t);
      osc.stop(t + 0.42);
      osc.onended = () => {
        osc.disconnect();
        amp.disconnect();
      };
    });
  } catch {
    /* ignore */
  }
}

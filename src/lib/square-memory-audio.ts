/**
 * Arcade hits. The context is created on Begin, never at import.
 * Mute stays silent. No spoken voice.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let blocked = false;

const LOUD = 1;

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
      master.gain.value = muted ? 0 : LOUD;
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
    if (master && ctx) master.gain.setTargetAtTime(next ? 0 : LOUD, ctx.currentTime, 0.01);
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  return muted;
}

function noiseBuffer(audio: AudioContext, seconds: number): AudioBuffer {
  const n = Math.max(1, Math.floor(audio.sampleRate * seconds));
  const buf = audio.createBuffer(1, n, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Square-wave stab plus a noise click. Peak is high on purpose. */
function punch(freq: number, dur: number, gain: number): void {
  if (muted) return;
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.62), t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);

    const click = audio.createBufferSource();
    click.buffer = noiseBuffer(audio, 0.045);
    const bp = audio.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 900;
    const ng = audio.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(Math.min(0.45, gain * 0.55), t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    click.connect(bp);
    bp.connect(ng);
    ng.connect(bus);
    click.start(t);
    click.stop(t + 0.05);

    const end = () => {
      osc.disconnect();
      amp.disconnect();
      click.disconnect();
      bp.disconnect();
      ng.disconnect();
    };
    osc.onended = end;
  } catch {
    /* a failed hit must not cancel the round */
  }
}

/** Loud hit on the flash. The landing square sits higher than the piece's square. */
export function playWatch(index: number): void {
  const ply = Math.floor(index / 2);
  const fromSquare = index % 2 === 0;
  const root = fromSquare ? 392 : 587;
  const freq = root * (1 + (ply % 5) * 0.06);
  punch(freq, 0.11, 0.72);
}

export function playHit(): void {
  punch(880, 0.07, 0.38);
}

export function playMiss(): void {
  punch(110, 0.22, 0.55);
}

export function playWin(): void {
  if (muted || !ctx || !master) return;
  try {
    const audio = ctx;
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      const t = audio.currentTime + i * 0.08;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.42, t + 0.008);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(amp);
      amp.connect(master!);
      osc.start(t);
      osc.stop(t + 0.18);
      osc.onended = () => {
        osc.disconnect();
        amp.disconnect();
      };
    });
  } catch {
    /* ignore */
  }
}

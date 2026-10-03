/**
 * Board sounds for Grandmaster Vision.
 * Web Audio only, created on a click or a drag — never at import.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
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
      master.gain.value = 0.9;
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

/** Call from a click, a key, or a drag so later sounds are allowed to play. */
export function unlockGrandmasterAudio(): void {
  try {
    const audio = context();
    if (audio && audio.state === "suspended") void audio.resume().catch(() => {});
  } catch {
    blocked = true;
  }
}

function noise(audio: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(audio.sampleRate * seconds));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envGain(audio: AudioContext, peak: number, attack: number, release: number): GainNode {
  const amp = audio.createGain();
  const t = audio.currentTime;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  return amp;
}

/** Soft mechanical shutter. A short high click, not a camera sample. */
export function playShutter(): void {
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const t = audio.currentTime;
    const click = audio.createBufferSource();
    click.buffer = noise(audio, 0.07);
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    filter.Q.value = 0.7;
    const amp = envGain(audio, 0.22, 0.004, 0.06);
    click.connect(filter);
    filter.connect(amp);
    amp.connect(bus);
    click.start(t);
    click.stop(t + 0.08);

    const tick = audio.createOscillator();
    tick.type = "triangle";
    tick.frequency.setValueAtTime(1800, t);
    tick.frequency.exponentialRampToValueAtTime(420, t + 0.05);
    const tickAmp = envGain(audio, 0.06, 0.002, 0.05);
    tick.connect(tickAmp);
    tickAmp.connect(bus);
    tick.start(t);
    tick.stop(t + 0.07);
  } catch {
    /* a missed shutter must not stop the round */
  }
}

/** Wooden piece landing on a square. */
export function playWoodSnap(): void {
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const t = audio.currentTime;
    const knock = audio.createBufferSource();
    knock.buffer = noise(audio, 0.05);
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 280;
    filter.Q.value = 1.4;
    const amp = envGain(audio, 0.32, 0.002, 0.045);
    knock.connect(filter);
    filter.connect(amp);
    amp.connect(bus);
    knock.start(t);
    knock.stop(t + 0.06);

    const body = audio.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(210, t);
    body.frequency.exponentialRampToValueAtTime(90, t + 0.06);
    const bodyAmp = envGain(audio, 0.12, 0.002, 0.07);
    body.connect(bodyAmp);
    bodyAmp.connect(bus);
    body.start(t);
    body.stop(t + 0.08);
  } catch {
    /* ignore */
  }
}

/** Quiet major chord when the rebuild is 80% or better. */
export function playVictoryChord(): void {
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const t = audio.currentTime + index * 0.03;
      const osc = audio.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      const amp = audio.createGain();
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      osc.connect(amp);
      amp.connect(bus);
      osc.start(t);
      osc.stop(t + 0.72);
    });
  } catch {
    /* ignore */
  }
}

/** Soft falling tone when the rebuild is under 80%. */
export function playErrorTone(): void {
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(392, t);
    osc.frequency.exponentialRampToValueAtTime(311, t + 0.28);
    const amp = audio.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(t);
    osc.stop(t + 0.38);
  } catch {
    /* ignore */
  }
}

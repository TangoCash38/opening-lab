/**
 * Square Memory tones. The context is created on Start or the first tap,
 * never at import. Mute stays silent. No spoken voice and no audio files.
 *
 * Ranks 1–8 follow a C major pentatonic. Ranks 1–6 are C4 through C5.
 * Ranks 7 and 8 continue that same scale (D5, E5) so every rank has its own pitch.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let blocked = false;
let clickNoise: AudioBuffer | null = null;

const LOUD = 1;

/** C4 D4 E4 G4 A4 C5, then D5 E5. Index 0 is rank 1. */
export const RANK_HZ = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25] as const;

/** C5 E5 G5. Played together as the round-complete chime. */
export const ROUND_TRIAD_HZ = [523.25, 659.25, 783.99] as const;

export function rankHz(square: string): number {
  const rank = Number(String(square).charAt(1));
  if (rank >= 1 && rank <= 8) return RANK_HZ[rank - 1]!;
  return RANK_HZ[0];
}

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

/** Short band-passed knock layered under the square tone. */
function woodClick(audio: AudioContext, bus: GainNode, t: number): void {
  if (!clickNoise || clickNoise.sampleRate !== audio.sampleRate) {
    clickNoise = noiseBuffer(audio, 0.03);
  }
  const click = audio.createBufferSource();
  click.buffer = clickNoise;
  const bp = audio.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1900, t);
  bp.Q.setValueAtTime(8, t);
  const ng = audio.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.7, t + 0.001);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
  click.connect(bp);
  bp.connect(ng);
  ng.connect(bus);
  click.start(t);
  click.stop(t + 0.03);

  const knock = audio.createOscillator();
  const kg = audio.createGain();
  knock.type = "sine";
  knock.frequency.setValueAtTime(240, t);
  knock.frequency.exponentialRampToValueAtTime(120, t + 0.025);
  kg.gain.setValueAtTime(0.0001, t);
  kg.gain.exponentialRampToValueAtTime(0.28, t + 0.001);
  kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
  knock.connect(kg);
  kg.connect(bus);
  knock.start(t);
  knock.stop(t + 0.04);
  knock.onended = () => {
    click.disconnect();
    bp.disconnect();
    ng.disconnect();
    knock.disconnect();
    kg.disconnect();
  };
}

/** Synth tone at the square's rank, with the wood click on top. */
function toneSquare(square: string): void {
  if (muted) return;
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const freq = rankHz(square);
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const amp = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.max(800, freq * 5), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 2), t + 0.16);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.2, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(bus);
    osc.start(t);
    osc.stop(t + 0.22);
    woodClick(audio, bus, t);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      amp.disconnect();
    };
  } catch {
    /* a failed hit must not cancel the round */
  }
}

export function playWatch(square: string): void {
  toneSquare(square);
}

export function playHit(square: string): void {
  toneSquare(square);
}

/** Low square-wave drop. Visuals do not depend on this succeeding. */
export function playMiss(): void {
  if (muted) return;
  const audio = ctx;
  const bus = master;
  if (!audio || !bus) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.32);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.24, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(t);
    osc.stop(t + 0.4);
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  } catch {
    /* ignore */
  }
}

/** Major triad when a round is finished correctly. */
export function playWin(): void {
  if (muted || !ctx || !master) return;
  try {
    const audio = ctx;
    ROUND_TRIAD_HZ.forEach((freq, i) => {
      const t = audio.currentTime + 0.06 + i * 0.04;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
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

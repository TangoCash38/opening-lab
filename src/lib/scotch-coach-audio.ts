/**
 * Sean's Scotch coach narration. One element, started from the Practice tap
 * (same gate as the cream card) and stopped by Skip, Practice, or leaving.
 * An analyser on that element drives the cartoon mouth. No second recording.
 */
import {
  SCOTCH_COACH_NARRATION_MP3,
  SCOTCH_COACH_NARRATION_OGG,
  scotchCoachMouthOpen,
} from "@/lib/scotch-coach";

let narration: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mouthGain: GainNode | null = null;
let source: MediaElementAudioSourceNode | null = null;
let timeData: Uint8Array | null = null;
let mouthOpen = 0;
let mouthFrame = 0;
const mouthListeners = new Set<(open: number) => void>();

export function scotchCoachNarration(): HTMLAudioElement | null {
  return narration;
}

function publishMouth(open: number) {
  mouthOpen = open;
  for (const listener of mouthListeners) listener(open);
}

function readRms(): number {
  if (!analyser || !timeData) return 0;
  analyser.getByteTimeDomainData(timeData as Uint8Array<ArrayBuffer>);
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    const sample = (timeData[i]! - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / timeData.length);
}

function tickMouth() {
  mouthFrame = 0;
  const audio = narration;
  const idle = !audio || audio.paused || audio.muted || audio.ended;
  if (idle) {
    publishMouth(0);
  } else {
    const target = scotchCoachMouthOpen(readRms(), {
      paused: false,
      muted: false,
      ended: false,
    });
    const follow = target > mouthOpen ? 0.62 : 0.34;
    let next = mouthOpen + (target - mouthOpen) * follow;
    if (next < 0.02) next = 0;
    publishMouth(next);
  }
  if (narration) mouthFrame = requestAnimationFrame(tickMouth);
}

function attachMouthMeter(audio: HTMLAudioElement) {
  if (source || typeof window === "undefined") return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const node = audioCtx.createAnalyser();
    node.fftSize = 2048;
    node.smoothingTimeConstant = 0.35;
    const src = audioCtx.createMediaElementSource(audio);
    const gain = audioCtx.createGain();
    gain.gain.value = audio.muted ? 0 : 1;
    src.connect(node);
    node.connect(gain);
    gain.connect(audioCtx.destination);
    analyser = node;
    mouthGain = gain;
    source = src;
    timeData = new Uint8Array(node.fftSize);
    if (!mouthFrame) mouthFrame = requestAnimationFrame(tickMouth);
  } catch {
    /* If the graph cannot attach, the element still plays and the mouth stays shut. */
  }
}

function releaseMouthMeter() {
  if (mouthFrame) cancelAnimationFrame(mouthFrame);
  mouthFrame = 0;
  try {
  source?.disconnect();
  analyser?.disconnect();
  mouthGain?.disconnect();
  } catch {
    /* already disconnected */
  }
  source = null;
  analyser = null;
  mouthGain = null;
  timeData = null;
  publishMouth(0);
}

/** Cartoon jaw, 0 shut … 1 wide. Closed while paused, muted, skipped, or ended. */
export function subscribeScotchCoachMouth(listener: (open: number) => void): () => void {
  mouthListeners.add(listener);
  listener(mouthOpen);
  return () => {
    mouthListeners.delete(listener);
  };
}

export function startScotchCoachNarration(): HTMLAudioElement | null {
  if (typeof document === "undefined") return null;
  if (narration && !narration.ended && !narration.error) {
    if (narration.paused) {
      const pending = narration.play();
      if (pending) pending.catch(() => {});
    }
    return narration;
  }
  stopScotchCoachNarration();
  const audio = document.createElement("audio");
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.loop = false;
  audio.setAttribute("data-scotch-coach-audio", "");
  const mp3 = document.createElement("source");
  mp3.src = SCOTCH_COACH_NARRATION_MP3;
  mp3.type = "audio/mpeg";
  const ogg = document.createElement("source");
  ogg.src = SCOTCH_COACH_NARRATION_OGG;
  ogg.type = "audio/ogg";
  audio.append(mp3, ogg);
  document.body.appendChild(audio);
  narration = audio;
  attachMouthMeter(audio);
  const pending = audio.play();
  if (pending) pending.catch(() => {});
  return audio;
}

export function stopScotchCoachNarration() {
  const audio = narration;
  narration = null;
  releaseMouthMeter();
  if (!audio) return;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    /* metadata may not be ready */
  }
  audio.removeAttribute("src");
  audio.replaceChildren();
  audio.load();
  audio.remove();
}

export function setScotchCoachNarrationMuted(muted: boolean) {
  if (narration) narration.muted = muted;
  if (mouthGain && audioCtx) {
    mouthGain.gain.setValueAtTime(muted ? 0 : 1, audioCtx.currentTime);
  }
}

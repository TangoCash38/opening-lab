/**
 * Sean's Scotch coach narration. One element, started from the Practice tap
 * (same gate as the cream card) and stopped by Skip, Practice, or leaving.
 */
import {
  SCOTCH_COACH_NARRATION_MP3,
  SCOTCH_COACH_NARRATION_OGG,
} from "@/lib/scotch-coach";

let narration: HTMLAudioElement | null = null;

export function scotchCoachNarration(): HTMLAudioElement | null {
  return narration;
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
  const pending = audio.play();
  if (pending) pending.catch(() => {});
  return audio;
}

export function stopScotchCoachNarration() {
  const audio = narration;
  if (!audio) return;
  narration = null;
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
}

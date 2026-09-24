/**
 * Sean's Scotch coach narration. One element, started from the Practice tap
 * (same gate as the cream card) and stopped by Skip, Practice, or leaving.
 * The Canal pack-recipe talk uses that same element once his file is flagged
 * ready. The seated picture stays still. No mouth overlay and no second recording.
 */
import {
  SCOTCH_CANAL_NARRATION_MP3,
  SCOTCH_CANAL_NARRATION_OGG,
  SCOTCH_CANAL_NARRATION_READY,
  SCOTCH_COACH_NARRATION_MP3,
  SCOTCH_COACH_NARRATION_OGG,
} from "@/lib/scotch-coach";

let narration: HTMLAudioElement | null = null;

export function scotchCoachNarration(): HTMLAudioElement | null {
  return narration;
}

function mountNarration(mp3Url: string, oggUrl: string, kind: string): HTMLAudioElement | null {
  if (typeof document === "undefined") return null;
  if (
    narration &&
    narration.getAttribute("data-scotch-coach-audio") === kind &&
    !narration.ended &&
    !narration.error
  ) {
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
  audio.setAttribute("data-scotch-coach-audio", kind);
  const mp3 = document.createElement("source");
  mp3.src = mp3Url;
  mp3.type = "audio/mpeg";
  const ogg = document.createElement("source");
  ogg.src = oggUrl;
  ogg.type = "audio/ogg";
  audio.append(mp3, ogg);
  document.body.appendChild(audio);
  narration = audio;
  const pending = audio.play();
  if (pending) pending.catch(() => {});
  return audio;
}

export function startScotchCoachNarration(): HTMLAudioElement | null {
  return mountNarration(SCOTCH_COACH_NARRATION_MP3, SCOTCH_COACH_NARRATION_OGG, "intro");
}

/**
 * Canal pack-recipe reading. Null until sean-canal-narration.mp3 and .ogg
 * are in public/scotch-coach and SCOTCH_CANAL_NARRATION_READY is true.
 * Does not invent a silent or synthetic file.
 */
export function startScotchCanalNarration(): HTMLAudioElement | null {
  if (!SCOTCH_CANAL_NARRATION_READY) return null;
  return mountNarration(SCOTCH_CANAL_NARRATION_MP3, SCOTCH_CANAL_NARRATION_OGG, "canal");
}

export function stopScotchCoachNarration() {
  const audio = narration;
  narration = null;
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
}

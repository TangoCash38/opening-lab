/**
 * Sean's Scotch coach narration. One element, started from the Practice tap
 * (same gate as the cream card) and stopped by Skip, Practice, or leaving.
 * Line 1 (sg1) uses the same element with professor-potato-pie-canal.mp3.
 * The cuppa intro keeps sean-coach-narration. The seated picture stays still.
 * No mouth overlay and no second recording.
 */
import {
  SCOTCH_CANAL_NARRATION_MP3,
  SCOTCH_COACH_NARRATION_MP3,
  SCOTCH_COACH_NARRATION_OGG,
} from "@/lib/scotch-coach";

let narration: HTMLAudioElement | null = null;

export function scotchCoachNarration(): HTMLAudioElement | null {
  return narration;
}

function mountNarration(mp3Url: string, oggUrl: string | null, kind: string): HTMLAudioElement | null {
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
  audio.append(mp3);
  if (oggUrl) {
    const ogg = document.createElement("source");
    ogg.src = oggUrl;
    ogg.type = "audio/ogg";
    audio.append(ogg);
  }
  document.body.appendChild(audio);
  narration = audio;
  const pending = audio.play();
  if (pending) pending.catch(() => {});
  return audio;
}

export function startScotchCoachNarration(): HTMLAudioElement | null {
  return mountNarration(SCOTCH_COACH_NARRATION_MP3, SCOTCH_COACH_NARRATION_OGG, "intro");
}

/** Canal pack-recipe reading. Mp3 only — the cuppa ogg stays on the intro. */
export function startScotchCanalNarration(): HTMLAudioElement | null {
  return mountNarration(SCOTCH_CANAL_NARRATION_MP3, null, "canal");
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

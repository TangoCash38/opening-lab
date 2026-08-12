/**
 * UI state machine for Deep Lines / punishment drills.
 * Keep pure so train-view can drive banners without ad-hoc string flags.
 */

export type PunishmentBannerState =
  | { kind: "idle" }
  | { kind: "blunder"; message: string; prompt?: string }
  | { kind: "success"; message: string };

export type PunishmentBannerEvent =
  | { type: "reset" }
  | { type: "mistake_played"; banner: string; prompt?: string }
  | { type: "line_complete"; explanation: string }
  | { type: "dismiss" };

export function nextPunishmentBannerState(
  prev: PunishmentBannerState,
  event: PunishmentBannerEvent,
): PunishmentBannerState {
  switch (event.type) {
    case "reset":
    case "dismiss":
      return { kind: "idle" };
    case "mistake_played":
      return {
        kind: "blunder",
        message: event.banner,
        prompt: event.prompt,
      };
    case "line_complete":
      return { kind: "success", message: event.explanation };
    default:
      return prev;
  }
}

/** True when the ply that just finished was the intentional opponent mistake. */
export function isMistakeJustPlayed(
  mistakePlyIndex: number | undefined,
  nextPly: number,
  wasUserMove: boolean,
): boolean {
  if (mistakePlyIndex === undefined) return false;
  if (wasUserMove) return false;
  return nextPly - 1 === mistakePlyIndex;
}

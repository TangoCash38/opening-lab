/**
 * Website first-run intro (brand → poster). v2 so testers who finished the
 * old three-phase intro see this flow once. Website return visits skip it
 * once this is "1". The Play wrap does not read this flag.
 */
export const HOME_INTRO_STORAGE_KEY = "opening-lab:home-intro:v2";

export function hasSeenHomeIntro(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(HOME_INTRO_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markHomeIntroSeen(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(HOME_INTRO_STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

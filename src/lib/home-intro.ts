/** First-run intro (two pages). Return visits skip it once this is "1". */
export const HOME_INTRO_STORAGE_KEY = "opening-lab:home-intro";

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

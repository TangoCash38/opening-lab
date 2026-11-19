/**
 * Creator Packs on the live site is a direct-URL test.
 * Home and every other link from the rest of the app stay off production
 * and off the live hosts. Typing /creator-packs still opens the pages.
 * The Vite plugin replaces the sentinel with VERCEL_ENV.
 *
 * `VITE_CREATOR_PACKS=0` hides the pages as well as the links.
 */

export type CreatorPacksGateInput = {
  /** `production`, `preview`, `development`, or empty outside Vercel. */
  vercelEnv: string;
  hostname: string;
  dev: boolean;
  /** `VITE_CREATOR_PACKS`. `0` hides links and pages. `1` cannot show links on production. */
  flag: string | undefined;
};

/** Live Opening Lab hosts. A preview deployment uses a different hostname. */
const LIVE_HOSTS = new Set([
  "openinglab.co.uk",
  "www.openinglab.co.uk",
  "opening-lab-xi.vercel.app",
  "opening-lab-tango6.vercel.app",
]);

/** Links from Home and the rest of the app. Never on a live host or a production build. */
export function creatorPacksPreviewDecision(input: CreatorPacksGateInput): boolean {
  const flag = input.flag?.trim();
  if (flag === "0" || flag === "false") return false;

  const vercelEnv = input.vercelEnv.trim();
  if (vercelEnv === "production") return false;

  const host = input.hostname.trim().toLowerCase().replace(/:\d+$/, "");
  if (LIVE_HOSTS.has(host)) return false;

  if (flag === "1" || flag === "true") return true;
  if (vercelEnv === "preview" || vercelEnv === "development") return true;
  if (input.dev) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (isVercelPreviewHost(host)) return true;
  return false;
}

function isVercelPreviewHost(host: string): boolean {
  if (!host.endsWith(".vercel.app") || LIVE_HOSTS.has(host)) return false;
  return host.includes("-git-") || host.split("-").length >= 3;
}

const INJECTED_VERCEL_ENV = "__VERCEL_ENV__";

function readVercelEnv(): string {
  const value = INJECTED_VERCEL_ENV;
  if (value.startsWith("__VERCEL") && value.endsWith("ENV__")) return "";
  return value;
}

export function creatorPacksPreviewEnabled(): boolean {
  const flag = import.meta.env.VITE_CREATOR_PACKS;
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  return creatorPacksPreviewDecision({
    vercelEnv: readVercelEnv(),
    hostname,
    dev: import.meta.env.DEV,
    flag: typeof flag === "string" ? flag : undefined,
  });
}

/** Direct /creator-packs URLs. On unless VITE_CREATOR_PACKS is explicitly off. */
export function creatorPacksRoutesEnabled(flag: string | undefined): boolean {
  const value = flag?.trim();
  if (value === "0" || value === "false") return false;
  return true;
}

export function creatorPacksRoutesOpen(): boolean {
  const flag = import.meta.env.VITE_CREATOR_PACKS;
  return creatorPacksRoutesEnabled(typeof flag === "string" ? flag : undefined);
}

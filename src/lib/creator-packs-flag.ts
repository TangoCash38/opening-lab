/**
 * Creator Packs is a draft preview. Production builds and the live hosts
 * never show it. The Vite plugin replaces the sentinel with VERCEL_ENV.
 */

export type CreatorPacksGateInput = {
  /** `production`, `preview`, `development`, or empty outside Vercel. */
  vercelEnv: string;
  hostname: string;
  dev: boolean;
  /** `VITE_CREATOR_PACKS`. `0` hides the preview. `1` cannot override production. */
  flag: string | undefined;
};

/** Live Opening Lab hosts. A preview deployment uses a different hostname. */
const LIVE_HOSTS = new Set([
  "openinglab.co.uk",
  "www.openinglab.co.uk",
  "opening-lab-xi.vercel.app",
  "opening-lab-tango6.vercel.app",
]);

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

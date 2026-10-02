import { useLayoutEffect, useState } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { COLOR_SCHEME_BOOT_SCRIPT } from "@/lib/color-scheme";

/**
 * First paint in the Play WebView is white until the stylesheet arrives.
 * Critical rules paint the app background and a small Loading tab immediately.
 * The boot script lets that paint happen, then reveals the page once app CSS
 * has applied. Fonts do not hold the tab.
 */
const APP_BOOT_CSS = `
html, body { background: #f4efe6; }
html[data-color-scheme="dark"], html[data-color-scheme="dark"] body { background: #141210; }
html:not(.opening-lab-booted) body > :not(#app-loading-tab) { visibility: hidden; }
html.opening-lab-booted #app-loading-tab { display: none; }
#app-loading-tab { animation: app-loading-tab 1s ease-in-out infinite; }
@keyframes app-loading-tab {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  #app-loading-tab { animation: none; }
}
`;

const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap";

function appBootScript(appHref: string): string {
  return `(() => {
  var appHref = ${JSON.stringify(appHref)};
  var root = document.documentElement;
  function boot() {
    if (window.__openingLabBooted) return;
    window.__openingLabBooted = true;
    root.classList.add("opening-lab-booted");
    var all = document.getElementsByTagName("link");
    for (var i = 0; i < all.length; i++) {
      if ((all[i].rel || "").toLowerCase() === "stylesheet") all[i].media = "all";
    }
  }
  var app = null;
  var links = document.getElementsByTagName("link");
  for (var j = 0; j < links.length; j++) {
    var link = links[j];
    if ((link.rel || "").toLowerCase() !== "stylesheet") continue;
    var href = link.getAttribute("href") || "";
    if (href === appHref) app = link;
  }
  if (!app || app.sheet) boot();
  else {
    app.addEventListener("load", boot);
    app.addEventListener("error", boot);
  }
  setTimeout(boot, 8000);
})();`;
}

function readBooted(): boolean {
  if (typeof window === "undefined") return false;
  return (window as Window & { __openingLabBooted?: boolean }).__openingLabBooted === true;
}

const APP_NAME = "Opening Lab";
const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const ogImage = host ? `https://${host}/og.jpg` : undefined;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { title: APP_NAME },
      {
        name: "description",
        content: "Strict chess opening lines · memory training",
      },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#2f5d50" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content: "Strict chess opening lines · memory training",
      },
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      /* Dynamic PWA manifest for install / home-screen */
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const [booted, setBooted] = useState(false);

  useLayoutEffect(() => {
    const mark = () => {
      document.documentElement.classList.add("opening-lab-booted");
      setBooted(true);
    };
    if (readBooted()) {
      mark();
      return;
    }
    const id = window.setInterval(() => {
      if (readBooted()) {
        mark();
        window.clearInterval(id);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  return (
    <html
      lang="en"
      className={booted ? "opening-lab-booted" : undefined}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_BOOT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: APP_BOOT_CSS }} />
        <link
          rel="stylesheet"
          href={appCss}
          media={booted ? "all" : "print"}
          onLoad={() => {
            document.documentElement.classList.add("opening-lab-booted");
            (window as Window & { __openingLabBooted?: boolean }).__openingLabBooted = true;
            setBooted(true);
          }}
        />
        <link rel="stylesheet" href={FONT_STYLESHEET} media={booted ? "all" : "print"} />
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: appBootScript(appCss) }} />
        <noscript
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `<link rel="stylesheet" href="${appCss}"/><link rel="stylesheet" href="${FONT_STYLESHEET}"/><style>html body>*{visibility:visible!important}#app-loading-tab{display:none!important}</style>`,
          }}
        />
      </head>
      <body>
        {booted ? null : (
          <div
            id="app-loading-tab"
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              zIndex: 80,
              top: "max(0.7rem, env(safe-area-inset-top, 0px))",
              left: "50%",
              transform: "translateX(-50%)",
              margin: 0,
              padding: "0.34rem 0.75rem",
              borderRadius: "999px",
              background: "#2f5d50",
              color: "#f5faf7",
              font: "600 0.75rem/1 system-ui, sans-serif",
              letterSpacing: "0.01em",
              pointerEvents: "none",
              boxShadow: "0 1px 2px rgba(28, 25, 21, 0.16)",
            }}
          >
            Loading
          </div>
        )}
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}

package uk.co.openinglab;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * Single in-app surface. The site loads in this WebView only.
 * Chrome TWA / Custom Tabs are never started.
 *
 * Resume / Play Store return must keep this WebView: never reload, never show
 * the piece splash again, never launch a second surface.
 */
public class LauncherActivity extends Activity {

    static final String HOST = "www.openinglab.co.uk";
    static final String APEX = "openinglab.co.uk";
    static final String SITE = "https://www.openinglab.co.uk/";
    static final String PLAY_UA = " OpeningLabPlay/1.0";
    static final int CREAM = 0xFFF4EFE6;

    /** Splash is only for the first process cold start. */
    private static boolean sColdStartDone;

    private WebView webView;
    private View splash;
    private boolean splashHidden;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final boolean coldStart = !sColdStartDone && savedInstanceState == null;
        if (!coldStart) {
            getWindow().setBackgroundDrawable(new ColorDrawable(CREAM));
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(CREAM);
        root.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        try {
            webView = new WebView(this);
        } catch (Exception e) {
            setContentView(missingWebViewMessage());
            sColdStartDone = true;
            return;
        }

        webView.setId(View.generateViewId());
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        webView.setBackgroundColor(CREAM);
        configureWebView(webView);
        root.addView(webView);

        if (coldStart) {
            splash = new View(this);
            splash.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            splash.setBackgroundResource(R.drawable.launch_screen);
            splash.setClickable(true);
            root.addView(splash);
        } else {
            splashHidden = true;
        }

        setContentView(root);

        if (savedInstanceState != null) {
            splashHidden = true;
            hideSplash(false);
            webView.restoreState(savedInstanceState);
        }

        if (webView.getUrl() == null) {
            webView.loadUrl(launchUrl(getIntent()));
        }

        sColdStartDone = true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // Keep the existing WebView. Only a real new deep link may navigate.
        if (webView == null || intent == null) return;
        if (Intent.ACTION_MAIN.equals(intent.getAction())) return;
        Uri data = intent.getData();
        if (data == null) return;
        if (!isOurHost(data.getHost())) return;

        String url = launchUrl(intent);
        if (url == null || sameUrl(url, SITE)) return;
        if (sameUrl(url, webView.getUrl())) return;
        webView.loadUrl(url);
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        // Returning from Home / Play Store: keep the page. Do not reload.
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean("splashHidden", true);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onPause() {
        if (splash != null) {
            splash.animate().cancel();
        }
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
        // Never reload. Never bring the piece overlay back.
        if (sColdStartDone) {
            getWindow().setBackgroundDrawable(new ColorDrawable(CREAM));
            hideSplash(false);
        }
    }

    @Override
    protected void onDestroy() {
        if (splash != null) {
            splash.animate().cancel();
            splash = null;
        }
        if (webView != null) {
            webView.stopLoading();
            ViewGroup parent = (ViewGroup) webView.getParent();
            if (parent != null) {
                parent.removeView(webView);
            }
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        // Do not finish() / trap the user on this screen. Home and recents
        // are not consumed here.
        moveTaskToBack(true);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        String ua = settings.getUserAgentString();
        if (ua == null || !ua.contains("OpeningLabPlay")) {
            settings.setUserAgentString((ua == null ? "" : ua) + PLAY_UA);
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(view, true);

        view.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        view.setWebChromeClient(new WebChromeClient());
        view.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageCommitVisible(WebView v, String url) {
                markPlayApp(v);
                hideSplash(true);
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                markPlayApp(v);
                hideSplash(true);
            }

            @Override
            public void onReceivedError(
                    WebView v,
                    WebResourceRequest request,
                    WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    hideSplash(true);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                return handleUri(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return handleUri(Uri.parse(url));
            }
        });
    }

    private boolean handleUri(Uri uri) {
        if (uri == null) return true;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if ("http".equals(scheme) || "https".equals(scheme)) {
            // Stay in this WebView — never hand off to Chrome / TWA.
            return false;
        }
        if ("mailto".equals(scheme) || "tel".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
            }
            return true;
        }
        // Ignore intent: and other schemes so we never relaunch TWA / ourselves.
        return true;
    }

    private void markPlayApp(WebView v) {
        if (v == null) return;
        v.evaluateJavascript(
                "try{sessionStorage.setItem('opening-lab:is-play-app','1')}catch(e){}",
                null);
    }

    private void hideSplash(boolean animate) {
        getWindow().setBackgroundDrawable(new ColorDrawable(CREAM));
        if (splashHidden) {
            return;
        }
        splashHidden = true;
        if (splash == null) return;
        if (!animate) {
            splash.setVisibility(View.GONE);
            return;
        }
        splash.animate()
                .alpha(0f)
                .setDuration(200)
                .withEndAction(() -> {
                    if (splash != null) {
                        splash.setVisibility(View.GONE);
                        splash.setAlpha(1f);
                    }
                })
                .start();
    }

    private String launchUrl(Intent intent) {
        if (intent == null) return SITE;
        Uri data = intent.getData();
        if (data == null) return SITE;
        if (!isOurHost(data.getHost())) return SITE;
        String url = data.toString();
        if (url.startsWith("http://")) {
            url = "https://" + url.substring("http://".length());
        }
        return url;
    }

    private static boolean isOurHost(String host) {
        if (host == null) return false;
        host = host.toLowerCase();
        return HOST.equals(host) || APEX.equals(host);
    }

    private static boolean sameUrl(String a, String b) {
        if (a == null || b == null) return false;
        return normalizeUrl(a).equals(normalizeUrl(b));
    }

    private static String normalizeUrl(String url) {
        try {
            Uri u = Uri.parse(url);
            String host = u.getHost() == null ? "" : u.getHost().toLowerCase();
            if (APEX.equals(host)) host = HOST;
            String path = u.getPath();
            if (path == null || path.isEmpty()) path = "/";
            while (path.length() > 1 && path.endsWith("/")) {
                path = path.substring(0, path.length() - 1);
            }
            StringBuilder out = new StringBuilder("https://").append(host).append(path);
            String q = u.getEncodedQuery();
            if (q != null && !q.isEmpty()) out.append('?').append(q);
            String f = u.getEncodedFragment();
            if (f != null && !f.isEmpty()) out.append('#').append(f);
            return out.toString();
        } catch (Exception e) {
            return url;
        }
    }

    private View missingWebViewMessage() {
        TextView text = new TextView(this);
        text.setBackgroundColor(CREAM);
        text.setTextColor(Color.parseColor("#1c1915"));
        text.setPadding(48, 96, 48, 48);
        text.setTextSize(16);
        text.setText("Opening Lab needs Android System WebView. "
                + "You can still train at openinglab.co.uk in any browser.");
        return text;
    }
}

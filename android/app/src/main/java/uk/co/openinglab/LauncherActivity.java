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
 * Chrome TWA / Custom Tabs are never started, so there is no splash transfer
 * and no second window that can bounce back to the piece graphic.
 */
public class LauncherActivity extends Activity {

    static final String HOST = "www.openinglab.co.uk";
    static final String SITE = "https://www.openinglab.co.uk/";
    static final String PLAY_UA = " OpeningLabPlay/1.0";
    static final int CREAM = 0xFFF4EFE6;

    private WebView webView;
    private View splash;
    private boolean splashHidden;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(CREAM);
        root.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        try {
            webView = new WebView(this);
        } catch (Exception e) {
            setContentView(missingWebViewMessage());
            return;
        }

        webView.setId(View.generateViewId());
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        webView.setBackgroundColor(CREAM);
        configureWebView(webView);
        root.addView(webView);

        splash = new View(this);
        splash.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        splash.setBackgroundResource(R.drawable.launch_screen);
        splash.setClickable(true);
        root.addView(splash);

        setContentView(root);

        if (savedInstanceState != null) {
            splashHidden = savedInstanceState.getBoolean("splashHidden", false);
            webView.restoreState(savedInstanceState);
            if (splashHidden) {
                hideSplash(false);
            }
            return;
        }

        webView.loadUrl(launchUrl(getIntent()));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (webView == null) return;
        String url = launchUrl(intent);
        if (url != null && !url.equals(SITE)) {
            webView.loadUrl(url);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean("splashHidden", splashHidden);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
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
        super.onBackPressed();
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
        if ("mailto".equals(scheme) || "tel".equals(scheme) || "intent".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
            }
            return true;
        }
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
        String host = data.getHost();
        if (host == null) return SITE;
        host = host.toLowerCase();
        if (HOST.equals(host) || "openinglab.co.uk".equals(host)) {
            String url = data.toString();
            if (url.startsWith("http://")) {
                url = "https://" + url.substring("http://".length());
            }
            return url;
        }
        return SITE;
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

package uk.co.openinglab;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.androidbrowserhelper.trusted.LauncherActivityMetadata;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.google.androidbrowserhelper.trusted.WebViewFallbackActivity;

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    /** If Chrome never takes over, open the site in the in-app WebView. */
    private static final long WEBVIEW_FALLBACK_MS = 5000;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable webViewFallback = this::openWebViewIfStillHere;
    private boolean webViewStarted;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent
        // background on Android 8.0 Oreo and below.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
        if (!isFinishing()) {
            mainHandler.postDelayed(webViewFallback, WEBVIEW_FALLBACK_MS);
        }
    }

    @Override
    protected TwaLauncher.FallbackStrategy getFallbackStrategy() {
        return TwaLauncher.WEBVIEW_FALLBACK_STRATEGY;
    }

    @Override
    protected void onDestroy() {
        mainHandler.removeCallbacks(webViewFallback);
        super.onDestroy();
    }

    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }

    private void openWebViewIfStillHere() {
        if (webViewStarted || isFinishing()) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 17 && isDestroyed()) {
            return;
        }
        webViewStarted = true;
        Intent intent = WebViewFallbackActivity.createLaunchIntent(
                this,
                getLaunchingUrl(),
                LauncherActivityMetadata.parse(this));
        startActivity(intent);
        finish();
    }
}

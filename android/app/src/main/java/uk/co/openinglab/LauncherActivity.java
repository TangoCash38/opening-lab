package uk.co.openinglab;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.google.androidbrowserhelper.trusted.LauncherActivityMetadata;
import com.google.androidbrowserhelper.trusted.WebViewFallbackActivity;

/**
 * Play entry point. Opens https://www.openinglab.co.uk in the in-app WebView.
 *
 * We deliberately skip Chrome Trusted Web Activity as the primary path: when
 * Digital Asset Links do not match Play App Signing (or Custom Tabs fails),
 * the old TWA launcher could leave users stuck on the green splash forever
 * even though the website works in Chrome. WebView is reliable for testing
 * and production until asset links are fully verified.
 */
public class LauncherActivity extends Activity {

    private static final String TAG = "OpeningLabLauncher";
    private static final String DEFAULT_URL = "https://www.openinglab.co.uk/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Orientation on translucent themes crashes on Oreo and below.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }

        if (openInWebView()) {
            finish();
            return;
        }

        // Last resort: external browser so testers are never stuck on splash.
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, launchUri()));
        } catch (Exception e) {
            Log.e(TAG, "Failed to open browser", e);
        }
        finish();
    }

    private boolean openInWebView() {
        try {
            Intent intent = WebViewFallbackActivity.createLaunchIntent(
                    this,
                    launchUri(),
                    LauncherActivityMetadata.parse(this));
            startActivity(intent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "WebView fallback failed", e);
            return false;
        }
    }

    private Uri launchUri() {
        try {
            int id = getResources().getIdentifier("launchUrl", "string", getPackageName());
            if (id != 0) {
                String fromRes = getString(id);
                if (fromRes != null && fromRes.startsWith("https://")) {
                    return Uri.parse(fromRes);
                }
            }
        } catch (Exception ignored) {
            // use default
        }
        return Uri.parse(DEFAULT_URL);
    }
}

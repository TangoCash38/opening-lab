# In-app WebView wrapper
-keep class uk.co.openinglab.** { *; }
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }
-keepclassmembers class android.webkit.WebView { *; }

# Play Billing Library + JS bridge (minify is on for release)
-keep class com.android.billingclient.** { *; }
-keep interface com.android.billingclient.** { *; }
-keepclassmembers class uk.co.openinglab.PlayBilling$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}


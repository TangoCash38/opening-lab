# Trusted Web Activity — keep android-browser-helper entry points.
-keep class com.google.androidbrowserhelper.** { *; }
-keep class uk.co.openinglab.** { *; }
-keep class androidx.browser.** { *; }
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }

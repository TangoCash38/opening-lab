# In-app WebView wrapper
-keep class uk.co.openinglab.** { *; }
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }
-keepclassmembers class android.webkit.WebView { *; }

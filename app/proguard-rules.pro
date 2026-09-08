# Add project specific ProGuard rules here.
# Keep WebView JS interface
-keep class com.phoenizia.tv.MainActivity$KeyboardBridge { *; }
# Keep FileProvider for APK updates
-keep class androidx.core.content.FileProvider { *; }

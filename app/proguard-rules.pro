# Add project specific ProGuard rules here.
# Keep WebView JS interface
-keep class com.phoenizia.tv.MainActivity$KeyboardBridge { *; }
# Keep FileProvider for APK updates
-keep class androidx.core.content.FileProvider { *; }
# Keep UpdateInstaller + ProgressCallback (R8 strips interface implementations)
-keep class com.phoenizia.tv.UpdateInstaller { *; }
-keep class com.phoenizia.tv.UpdateInstaller$ProgressCallback { *; }
# Keep UpdateDialog (instantiated from Kotlin lambdas)
-keep class com.phoenizia.tv.UpdateDialog { *; }
# Keep UpdateChecker
-keep class com.phoenizia.tv.UpdateChecker { *; }
-keep class com.phoenizia.tv.UpdateChecker$UpdateInfo { *; }
-keep class com.phoenizia.tv.UpdateChecker$Callback { *; }

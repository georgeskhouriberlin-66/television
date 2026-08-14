# Add project specific ProGuard rules here.
# Keep Media3 PlayerView (reflection via Compose interop)
-keep class androidx.media3.exoplayer.** { *; }
-keep class androidx.media3.common.** { *; }

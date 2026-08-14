# FireStick / Android TV Spezifikationen — Phönizia-TV

> **Checkliste** für Manifest, Resources, Assets & Store-Einreichung. Alles abhaken vor Release.

---

## 1. AndroidManifest.xml — Pflicht-Elemente

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.phoenizia.tv">

    <!-- Fire TV / Leanback Launcher -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.software.leanback" android:required="true" />
    <uses-feature android:name="android.hardware.screen.portrait" android:required="false" />
    <uses-feature android:name="android.hardware.screen.landscape" android:required="true" />

    <!-- Berechtigungen -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

    <application
        android:name=".PhoeniziaApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:banner="@drawable/banner"           <!-- 320x180, LEANBACK LAUNCHER -->
        android:label="@string/app_name"
        android:theme="@style/Theme.PhoeniziaTV"
        android:usesCleartextTraffic="false"
        android:hardwareAccelerated="true"
        android:resizeableActivity="false"
        android:supportsPictureInPicture="true">

        <!-- Leanback Launcher Intent -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:screenOrientation="landscape"
            android:configChanges="orientation|screenSize|keyboardHidden|uiMode"
            android:banner="@drawable/banner">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Media Session / Playback -->
        <service
            android:name=".player.MediaPlaybackService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

        <!-- App Shortcuts (optional) -->
        <meta-data
            android:name="android.app.shortcuts"
            android:resource="@xml/shortcuts" />

    </application>
</manifest>
```

**Checkliste:**
- [ ] `android:banner="@drawable/banner"` gesetzt (320×180)
- [ ] `android.software.leanback` required=true
- [ ] `android.hardware.touchscreen` required=false
- [ ] `LEANBACK_LAUNCHER` Category in MainActivity
- [ ] `android:screenOrientation="landscape"` (oder `sensorLandscape`)
- [ ] `android:configChanges` für Orientation/Keyboard/UI-Mode
- [ ] `android:usesCleartextTraffic="false"` (HTTPS only)
- [ ] Foreground Service Type `mediaPlayback` für Background-Audio

---

## 2. Drawable / Mipmap Assets — Exakte Größen

| Asset | Ordner | Größe | Format | Hinweis |
|-------|--------|-------|--------|---------|
| **App Icon (Launcher)** | `mipmap-mdpi` | 48×48 | PNG | Legacy |
| | `mipmap-hdpi` | 72×72 | PNG | |
| | `mipmap-xhdpi` | 96×96 | PNG | |
| | `mipmap-xxhdpi` | 144×144 | PNG | |
| | `mipmap-xxxhdpi` | 192×192 | PNG | |
| **Round Icon** | `mipmap-*-round` | wie oben | PNG | `android:roundIcon` |
| **Leanback Banner** | `drawable-xhdpi` | **320×180** | PNG/JPG | **Pflicht!** `android:banner` |
| | `drawable-xxhdpi` | 480×270 | PNG | High-DPI Fire TV |
| | `drawable-xxxhdpi` | 640×360 | PNG | 4K Fire TV |
| **Splash (optional)** | `drawable` | 1920×1080 | PNG | `windowSplashScreenAnimatedIcon` API 31+ |
| **Feature Graphic (Store)** | — | 1024×500 | PNG/JPG | Amazon Developer Console |
| **Screenshots (Store)** | — | 1920×1080 | PNG | Querformat, TV-UI |
| **Amazon App Icon** | — | **1280×720** | PNG | Amazon-spezifisch! |

**Dateinamen:**
```
res/
├── mipmap-mdpi/ic_launcher.png
├── mipmap-hdpi/ic_launcher.png
├── mipmap-xhdpi/ic_launcher.png
├── mipmap-xxhdpi/ic_launcher.png
├── mipmap-xxxhdpi/ic_launcher.png
├── mipmap-mdpi/ic_launcher_round.png
...
├── drawable-xhdpi/banner.png      ← 320x180 KRITISCH
├── drawable-xxhdpi/banner.png     ← 480x270
├── drawable-xxxhdpi/banner.png    ← 640x360
```

**Tools:** Android Studio → New → Image Asset (Launcher + Banner) — **Banner separat** als "Launcher Icons (Leanback)".

---

## 3. Fire OS Versions-Mapping & API Levels

| Fire OS | Android API | Min SDK | Target SDK | Hinweis |
|---------|-------------|---------|------------|---------|
| Fire OS 5 | 22 (5.1) | 21 | 22 | Legacy Sticks (Gen 1–2) — **Support prüfen** |
| Fire OS 6 | 25 (7.1) | 21 | 25 | Fire TV Stick 4K (Gen 1) |
| Fire OS 7 | 28 (9) | 21 | 28 | Fire TV Stick 4K Max, Cube Gen 2 |
| Fire OS 8 | 30 (11) | 21 | 30 | Neuere Geräte |

**Empfehlung:** `minSdk=21`, `targetSdk=34`, **Runtime-Checks** für APIs > 25.

```kotlin
// Utils für Version-Checks
object FireOS {
    val isFireOS5 = Build.VERSION.SDK_INT <= 22
    val isFireOS6 = Build.VERSION.SDK_INT == 25
    val isFireOS7 = Build.VERSION.SDK_INT >= 28 && Build.VERSION.SDK_INT <= 29
    val isFireOS8 = Build.VERSION.SDK_INT >= 30
}
```

---

## 4. D-Pad / Fokus-Navigation (Leanback / Compose TV)

### Classic Leanback
- `BrowseFragment` / `DetailsFragment` nutzen `ObjectAdapter` + `Presenter`
- Fokus: `setOnItemViewClickedListener`, `setOnItemViewSelectedListener`
- `setSelectedPosition(0)` initial setzen

### Compose for TV (Material3)
```kotlin
@Composable
fun TvFocusableCard(
    modifier: Modifier = Modifier,
    isFocused: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
            .focusable()
            .focusProperties { canFocus = true }
            .onFocusChanged { isFocused = it.isFocused }
            .onKeyEvent { event ->
                if (event.key == Key.DpadCenter && event.type == KeyEventType.KeyDown) {
                    onClick(); true
                } else false
            },
        colors = CardDefaults.cardColors(
            containerColor = if (isFocused) MaterialTheme.colorScheme.primaryContainer
                              else MaterialTheme.colorScheme.surfaceContainerHighest
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        // Content
    }
}
```

**Wichtige Regeln:**
- [ ] Alle clickbaren Elemente `focusable()` + `focusProperties { canFocus = true }`
- [ ] Fokus-Ring sichtbar (Mind. 2dp, Kontrast 3:1)
- [ ] `DpadCenter` = Click, `DpadUp/Down/Left/Right` = Navigation
- [ ] Kein `Touch`-Handling erforderlich, aber `onTouchEvent` nicht crashen
- [ ] Initialer Fokus auf erstem Item (`rememberFocusRequester().requestFocus()`)
- [ ] Scroll-Container: `TvLazyColumn` / `TvLazyRow` (nicht normale `LazyColumn`)

---

## 5. Overscan / Safe Area (TV-Displays)

```xml
<!-- res/values/dimens.xml -->
<dimen name="tv_overscan_margin">48dp</dimen>  <!-- 5% von 1920 -->
<dimen name="tv_safe_inset">24dp</dimen>
```

```kotlin
// Compose: Safe Area anwenden
@Composable
fun TvSafeContainer(content: @Composable (PaddingValues) -> Unit) {
    val insets = rememberTvSystemInsets()
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(insets.systemBarsAsPaddingValues())
    ) {
        content(insets.systemBarsAsPaddingValues())
    }
}
```

**Test:** Amazon "Display Safe Area" Tool (Fire TV Settings → Display → Calibrate Display) — UI muss im grünen Bereich bleiben.

---

## 6. Media Session & Playback (Fire TV Integration)

```xml
<!-- res/xml/media_session_actions.xml -->
<media-session-actions>
    <action android:name="android.media.session.action.PLAY" />
    <action android:name="android.media.session.action.PAUSE" />
    <action android:name="android.media.session.action.SKIP_TO_NEXT" />
    <action android:name="android.media.session.action.SKIP_TO_PREVIOUS" />
    <action android:name="android.media.session.action.FAST_FORWARD" />
    <action android:name="android.media.session.action.REWIND" />
</media-session-actions>
```

```kotlin
// MediaSessionCompat Setup
val session = MediaSessionCompat(this, "PhoeniziaSession").apply {
    setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
             MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS)
    setPlaybackState(PlaybackStateCompat.Builder()
        .setActions(PlaybackStateCompat.ACTION_PLAY or
                    PlaybackStateCompat.ACTION_PAUSE or
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                    PlaybackStateCompat.ACTION_FAST_FORWARD or
                    PlaybackStateCompat.ACTION_REWIND)
        .setState(PlaybackStateCompat.STATE_PLAYING, 0, 1f)
        .build())
    setMediaButtonReceiver(null) // System handles via MediaButtonReceiver
}
```

**Check:**
- [ ] `MediaSession` in `onCreate` der MainActivity / Service
- [ ] `PlaybackState` Updates bei Play/Pause/Seek
- [ ] `MediaMetadata` mit Titel, Artwork, Duration
- [ ] `MediaButtonReceiver` im Manifest (auto via Media3)

---

## 7. Amazon Appstore Assets — Exakt

| Asset | Größe | Format | Dateiname |
|-------|-------|--------|-----------|
| **App Icon** | **1280×720** | PNG (transparenter BG ok) | `icon_1280x720.png` |
| **Banner (Leanback)** | **320×180** | PNG/JPG | `banner_320x180.png` |
| **Screenshots** | 1920×1080 | PNG | `screenshot_1.png` … `screenshot_5.png` |
| **Feature Graphic** | 1024×500 | PNG/JPG | `feature_1024x500.png` |
| **TV Banner (optional)** | 1280×720 | PNG | `tv_banner_1280x720.png` |

**Wichtig:** Amazon verlangt **1280×720 App Icon** (nicht 512×512 wie Google). Banner **320×180** ist Pflicht für Leanback Launcher.

---

## 8. Performance Budgets (FireStick 4K Max Referenz)

| Metrik | Ziel | Messung |
|--------|------|---------|
| **Cold Start** | < 2.0s | `adb shell am start -W` → `TotalTime` |
| **UI Thread Block** | < 16ms/frame | `Profile GPU Rendering` → "On screen as bars" |
| **Memory (PSS)** | < 150 MB | `adb shell dumpsys meminfo com.phoenizia.tv` |
| **APK Size** | < 50 MB (compressed) | `bundletool` / Play Console |
| **ExoPlayer Init** | < 500ms | Custom Trace |

**Profiling Commands:**
```bash
# Startup Trace
adb shell am start -W -n com.phoenizia.tv/.MainActivity

# Memory
adb shell dumpsys meminfo com.phoenizia.tv

# GPU Overdraw
adb shell setprop debug.hwui.overdraw_count 1

# Frame Timing
adb shell dumpsys gfxinfo com.phoenizia.tv framestats
```

---

## 9. Fire TV Testing Matrix

| Gerät | Fire OS | Resolution | DPI | CPU | RAM | Test-Status |
|-------|---------|------------|-----|-----|-----|-------------|
| Fire TV Stick Lite (Gen 1) | 6/7 | 1080p | mdpi | MT8695 | 1 GB | ☐ |
| Fire TV Stick 4K (Gen 1) | 6/7 | 4K@60 | xhdpi | MT8695 | 1.5 GB | ☐ |
| Fire TV Stick 4K Max (Gen 1/2) | 7/8 | 4K@60 | xhdpi | MT8696 | 2 GB | ☐ |
| Fire TV Cube (Gen 2/3) | 7/8 | 4K@60 | xhdpi | Amlogic | 2 GB | ☐ |
| Fire TV Smart TV (Toshiba/Insignia) | 7/8 | 4K | xhdpi/xxhdpi | Various | 1.5–2 GB | ☐ |

**Mindest-Test:** 1x Low-End (Stick Lite), 1x High-End (4K Max), 1x Cube.

---

## 10. Pre-Release Checkliste (Copy-Paste)

```
[ ] Manifest: Leanback Launcher, Banner, Touchscreen=false
[ ] Icons: mipmap alle Dichten, round, Banner 320x180 (xhdpi/xxhdpi/xxxhdpi)
[ ] Manifest: targetSdk=34, minSdk=21, permissions minimal
[ ] MediaSession: Play/Pause/Next/Prev/FF/RW funktionieren via Fernbedienung
[ ] Fokus: Alle Buttons/Items per D-Pad erreichbar, Fokus-Ring sichtbar
[ ] Overscan: Content in Safe Area (48dp Rand), keine abgeschnittenen Texte
[ ] Splash: Kein weißer Flash, Theme-Background = App-Background
[ ] Player: ExoPlayer Media3, HLS/DASH/DRM getestet
[ ] Audio: Fokus-Verlust → Pause, Fokus-Zurück → Resume (MediaSession)
[ ] Network: Offline-Handling, Retry-UI, Timeout < 10s
[ ] ProGuard: Release build läuft, keine Crashes, Logs entfernt
[ ] Signing: Release AAB signiert, Keystore gesichert
[ ] Lint: ./gradlew lintRelease → 0 Errors, 0 Warnings (Critical)
[ ] Amazon Assets: 1280x720 Icon, 320x180 Banner, 5 Screenshots 1920x1080, Feature 1024x500
[ ] Content Rating: USK/PEGI ausgefüllt
[ ] Datenschutz: Privacy Policy URL in Console + App (Settings)
[ ] Test: Auf 3 Geräten (Low/Mid/High) manuell durchgeklickt
[ ] Crashlytics/Analytics: Release-Build sendet Events
```

---

**Stand**: 2026-07-22 — Für Phönizia-TV FireStick Release.
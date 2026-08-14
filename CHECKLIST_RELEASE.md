# Release Checkliste — Phönizia-TV (Amazon Appstore)

> Jede Box wird **vor** dem Release abgehakt. Bei "❌" → nicht releasen.

---

## Phase 1: Code-Freeze (24h vor Release)

### Build & Dependencies
- [ ] `./gradlew lintRelease` → 0 Errors, 0 Warnings (Critical)
- [ ] `./gradlew build` → Clean Build erfolgreich
- [ ] Keine Abhängigkeiten mit bekannten CVEs (npm audit / Dependabot)
- [ ] `minSdk=21`, `targetSdk=34` korrekt gesetzt
- [ ] `versionCode` erhöht (monoton steigend)
- [ ] `versionName` auf Release-Version gesetzt (z.B. `1.0.1`)
- [ ] `compileSdk = 34`, Kotlin 2.0+, Compose Compiler 1.5+

### ProGuard / R8
- [ ] Release Build ist minified + shrunk
- [ ] ExoPlayer / Media3 ist nicht wegoptimiert
- [ ] Moshi/Kotlinx Serialization funktioniert
- [ ] Hilt/Dagger generiert korrekt
- [ ] `./gradlew assembleRelease` → APK/AAB unter 50 MB

### Signing
- [ ] Keystore existiert und ist gesichert (Backup!)
- [ ] `keystore.properties` ist aktuell
- [ ] `storePassword` und `keyPassword` sind korrekt
- [ ] Release AAB ist signiert: `jarsigner -verify -verbose -certs app-release.aab` → "jar verified"
- [ ] Keystore-Info in `.gitignore` (nicht im Repo!)

---

## Phase 2: UI & Inhalt

### Manifest
- [ ] `android:banner="@drawable/banner"` gesetzt (320×180)
- [ ] `android.software.leanback` required=true
- [ ] `android.hardware.touchscreen` required=false
- [ ] `LEANBACK_LAUNCHER` Intent-Filter in MainActivity
- [ ] Keine Portrait-orientierten Activities
- [ ] `android:supportsPictureInPicture="true"` korrekt
- [ ] `android:usesCleartextTraffic="false"` (nur HTTPS)
- [ ] `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission

### Resources
- [ ] App Icon in **allen** Dichten: mdpi–xxxhdpi
- [ ] Round Icon: identisch zu Icon (kein eigenes)
- [ ] Leanback Banner: **320×180** (`drawable-xhdpi/banner.png`)
- [ ] Banner auch in xxhdpi (480×270) + xxxhdpi (640×360)
- [ ] Keine fehlenden `@string`-Referenzen (alle übersetzt)
- [ ] Strings: Deutsch (Primär) + Englisch (Fallback) + ggf. Türkisch/Arabisch (Amazon Top-Märkte)

### Splash Screen
- [ ] Theme-Background = App-Background (#0F0F23) → kein weißer Flash
- [ ] `windowSplashScreenAnimatedIcon` (API 31+) ist gesetzt oder deaktiviert
- [ ] `windowSplashScreenBackground` = `#0F0F23`

### Design System Konsistenz (Stichprobe)
- [ ] Alle Card-Radius: 12dp (einheitlich)
- [ ] Alle Button-Radius: 12dp (einheitlich)
- [ ] Alle Abstände: 8dp-Raster eingehalten? (Stichprobe 3 Screens)
- [ ] Keine harten `#000000` / `#FFFFFF` im UI (nur `#0F0F23` / `#F5F5F0`)
- [ ] Fokus-Ring Gold (#CA8A04, 2dp) auf allen interaktiven Elementen
- [ ] Farben aus Design System, nicht hartcodiert

---

## Phase 3: Funktionale Tests (Manuell)

### Navigation
- [ ] D-Pad Up/Down/Left/Right: Alle Elemente erreichbar
- [ ] D-Pad Center/Enter: Aktion ausgeführt
- [ ] Back-Button: korrekte Navigation (kein App-Exit außer auf Home)
- [ ] Menu/Settings-Button auf Fernbedienung
- [ ] Keine "Todeszonen" (D-Pad bleibt auf einem Element hängen)
- [ ] Initialer Fokus auf sinnvollem Start-Element

### Player / Playback
- [ ] HLS-Stream startet < 3s (bei guter Verbindung)
- [ ] Play/Pause via Fernbedienung
- [ ] Vor/Zurück-Spulen (FF/RW per D-Pad Left/Right im Player)
- [ ] Lautstärke via Fire TV Remote
- [ ] Stream-Wechsel (Kanalwechsel) < 2s
- [ ] Audio: Fokus-Verlust → Pause, Fokus-Zurück → Resume
- [ ] Audio Background Play: schaltet weiter (oder stoppt, je nach Wunsch)
- [ ] Offline-Fehler: "Keine Verbindung" UI (nicht frozen)
- [ ] Live-Tag: Buffering-Indikator bei Ladeverzögerung

### Settings
- [ ] Einstellungen werden persistiert (DataStore / SharedPreferences)
- [ ] Sprache wechseln funktioniert (App-Neustart)
- [ ] Player-Qualität (Auto/HD/SD) einstellbar
- [ ] About / Impressum / Datenschutz-Einträge vorhanden

### EPG / Channel List
- [ ] Channel-Liste lädt (mock / live)
- [ ] Kategorien filterbar
- [ ] Scrolling: TvLazyColumn flüssig, kein Jank
- [ ] LIVE-Indikator aktualisiert sich
- [ ] Channel-Logo (falls vorhanden) wird angezeigt

---

## Phase 4: Geräte-Tests (Mindestens 3 Geräte)

| Gerät | Fire OS | RAM | Auflösung | Datum | Status |
|-------|---------|-----|-----------|-------|--------|
| Fire TV Stick Lite (Gen 1) | 6/7 | 1 GB | 1080p | ___ | ☐ ☑ |
| Fire TV Stick 4K Max | 7/8 | 2 GB | 4K | ___ | ☐ ☑ |
| Fire TV Cube | 7/8 | 2 GB | 4K | ___ | ☐ ☑ |
| Android TV Emulator (API 21) | — | 1 GB | 720p | ___ | ☐ ☑ |
| Android TV Emulator (API 34) | — | 2 GB | 1080p | ___ | ☐ ☑ |

- [ ] Alle Geräte: App startet ohne Crash
- [ ] Alle Geräte: Player läuft durch (> 1h Test)
- [ ] Low-End (1 GB RAM): kein OutOfMemoryError
- [ ] High-End (4K): flüssiger Player, keine UI-Ruckler
- [ ] Emulator API 21: kein API-Mismatch

---

## Phase 5: Performance

| Metrik | Ziel | Gemessen | OK? |
|--------|------|----------|-----|
| Cold Start (adb) | < 2.0s | ____ ms | ☐ |
| Warm Start | < 500ms | ____ ms | ☐ |
| APK Size (Release) | < 50 MB | ____ MB | ☐ |
| AAB Size (Download) | < 30 MB | ____ MB | ☐ |
| Memory PSS (idle) | < 80 MB | ____ MB | ☐ |
| Memory PSS (playing) | < 150 MB | ____ MB | ☐ |
| UI Frame Rate | 60 fps (keine Drops) | ____ % Drops | ☐ |
| ExoPlayer Init | < 500ms | ____ ms | ☐ |

---

## Phase 6: Amazon Appstore Assets

| Asset | Größe | Pfad | Erstellt? |
|-------|-------|------|-----------|
| **App Icon** | **1280×720** PNG | `assets/store/icon_1280x720.png` | ☐ |
| **Banner (Leanback)** | **320×180** PNG | `app/src/main/res/drawable-xhdpi/banner.png` | ☐ |
| Banne (hdpi) | 240×135 | `drawable-hdpi/banner.png` | ☐ |
| Banne (xxhdpi) | 480×270 | `drawable-xxhdpi/banner.png` | ☐ |
| Banne (xxxhdpi) | 640×360 | `drawable-xxxhdpi/banner.png` | ☐ |
| **Screenshot 1 (TV)** | 1920×1080 | `assets/store/screenshot_1_home.png` | ☐ |
| **Screenshot 2 (TV)** | 1920×1080 | `assets/store/screenshot_2_player.png` | ☐ |
| **Screenshot 3 (TV)** | 1920×1080 | `assets/store/screenshot_3_epg.png` | ☐ |
| **Screenshot 4 (TV)** | 1920×1080 | `assets/store/screenshot_4_channel.png` | ☐ |
| **Screenshot 5 (TV)** | 1920×1080 | `assets/store/screenshot_5_settings.png` | ☐ |
| Feature Graphic | 1024×500 | `assets/store/feature_1024x500.png` | ☐ |
| TV Banner (optional) | 1280×720 | `assets/store/tv_banner_1280x720.png` | ☐ |
| **Privacy Policy** | URL | In Console + App Settings | ☐ |

---

## Phase 7: Amazon Developer Console

### App-Informationen
- [ ] App-Kategorie: "Entertainment" / "Media & Video"
- [ ] Beschreibung: Deutsch + Englisch (und ggf. Türkisch)
- [ ] Keywords: IPTV, TV, Stream, Fire TV, live tv, phoenizia, fernsehen
- [ ] Datenschutzerklärung URL hinterlegt
- [ ] Content Rating: USK/PEGI ausgefüllt (wahrscheinlich "Alle Altersstufen" oder "6+")
- [ ] Keine Markenrechtsverletzungen in Name/Icon/Assets

### Geräte-Auswahl
- [ ] Fire TV Stick (Gen 1–3)
- [ ] Fire TV Stick 4K (Gen 1–2)
- [ ] Fire TV Stick 4K Max
- [ ] Fire TV Cube (Gen 1–3)
- [ ] Fire TV (Smart TVs – Toshiba, Insignia, etc.)

### Preise & Vertrieb
- [ ] Kostenlos / Bezahlt? (Entscheidung getroffen)
- [ ] Falls Bezahlt: IAP v2 (Amazon In-App Purchasing) implementiert & getestet
- [ ] Verfügbare Länder (DACH / EU / Weltweit)

---

## Phase 8: Letzter Check Vor Upload

- [ ] Git: Alle UI-Commits gemerged, Tag gesetzt (`git tag v1.0.0`)
- [ ] Release Build frisch gebaut (nicht älter als 24h)
- [ ] AAB-Signatur verifiziert
- [ ] Keine Debug-Builds in Release (kein `applicationIdSuffix=".debug"`, kein `android:debuggable="true"`)
- [ ] Keine `Toast`, `Log.d/v/i` mehr (Logs via Timber, Release-Crashlytys only)
- [ ] Keine Test-API-Keys / Mock-URLs in Release-Build
- [ ] Ergebnis: `./gradlew assembleRelease > build.log 2>&1` → 0 Errors

---

## Phase 9: Nach Release

- [ ] Release-Build in Amazon Appstore hochladen: `app/build/outputs/bundle/release/app-release.aab`
- [ ] Release Notes: Deutsch + Englisch (was sich geändert hat)
- [ ] Submit for Review
- [ ] Monitoring: Crashlytics steigt nicht > 0.1%
- [ ] Backup: AAB + ProGuard Mapping + Keystore in sicherer Cloud/Drive
- [ ] GitHub: Release-Draft mit CHANGELOG, AAB-Link, Tag

### Post-Release (24–48h)
- [ ] App im Store live?
- [ ] Erste Crashes analysiert?
- [ ] User-Bewertungen gelesen?
- [ ] Hotfix nötig? → Branch `release/v1.0.x` → cherry-pick → `v1.0.1`

---

## Quick Command Summary

```bash
# Clean Release Build
./gradlew clean bundleRelease

# Verify Signature
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab

# Check APK Size
ls -lh app/build/outputs/apk/release/app-release.apk

# Lint
./gradlew lintRelease

# Start Trace (Cold)
adb shell am start -W -n com.phoenizia.tv/.MainActivity

# Memory
adb shell dumpsys meminfo com.phoenizia.tv
```

---

**Stand**: 2026-07-22 — Release 1.0.0
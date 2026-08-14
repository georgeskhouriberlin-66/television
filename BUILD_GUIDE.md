# Build Guide — Phönizia-TV (FireStick / Android TV)

> **Voraussetzung**: Android Studio Ladybug+ / IntelliJ mit Android Plugin, JDK 17+ (JDK 21 empfohlen), `ANDROID_HOME` gesetzt. `compileSdk 36` muss im SDK installiert sein.

> **Wichtig (Windows)**: Der Projektpfad darf **keine Umlaute/Non-ASCII-Zeichen** enthalten (AGP verweigert sonst den Build, b.android.com/95744). Der Ordner heißt deshalb `PhoeniciaTV`, nicht `Phönizia-TV`.

---

## 1. Repository klonen & öffnen

```bash
git clone <dein-repo-url> PhoeniziaTV
cd PhoeniziaTV
# In Android Studio: File → Open → PhoeniziaTV Ordner wählen
```

---

## 2. Keystore erstellen (einmalig)

```bash
# Im Projekt-Root oder ~/.android/ (nicht ins Repo!)
keytool -genkey -v \
  -keystore phoenizia-release.keystore \
  -alias phoenizia \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <STORE_PASS> \
  -keypass <KEY_PASS> \
  -dname "CN=Phönizia TV, OU=Engineering, O=Phönizia, L=Berlin, ST=Berlin, C=DE"
```

**Wichtig**: Passwörter **nicht** committen. Keystore-Datei sicher ablegen (Backup!).

---

## 3. `keystore.properties` anlegen (lokal, `.gitignore`)

```properties
# E:\Brain\AndroidStudio\PhoeniziaTV\keystore.properties (oder Projekt-Root)
storeFile=../phoenizia-release.keystore
storePassword=DEIN_STORE_PASS
keyAlias=phoenizia
keyPassword=DEIN_KEY_PASS
```

In `.gitignore`:
```
keystore.properties
*.keystore
```

---

## 4. `build.gradle.kts` (App-Module) — Signing Config

```kotlin
// app/build.gradle.kts
import java.io.FileInputStream
import java.util.Properties

android {
    namespace = "com.phoenizia.tv"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.phoenizia.tv"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        // Fire TV / Leanback
        manifestPlaceholders["leanback"] = "true"
    }

    signingConfigs {
        create("release") {
            val props = Properties()
            val file = rootProject.file("keystore.properties")
            if (file.exists()) {
                file.inputStream().use { props.load(it) }
                storeFile = file(props["storeFile"] as String)
                storePassword = props["storePassword"] as String
                keyAlias = props["keyAlias"] as String
                keyPassword = props["keyPassword"] as String
            } else {
                println("⚠️ keystore.properties nicht gefunden – Release unsigniert")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            isDebuggable = true
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    buildFeatures {
        compose = true // falls Compose for TV
        viewBinding = true // falls Classic Views
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.2")
    implementation("androidx.activity:activity-compose:1.9.0") // für Compose

    // Leanback (Classic) ODER Compose for TV
    // implementation("androidx.leanback:leanback:1.0.0")
    // implementation("androidx.leanback:leanback-preference:1.0.0")

    // Compose for TV (Material3)
    implementation("androidx.tv:tv-material:1.1.0")
    implementation("androidx.tv:tv-foundation:1.0.0")

    // ExoPlayer (Media3)
    implementation("androidx.media3:media3-exoplayer:1.10.1")
    implementation("androidx.media3:media3-ui:1.10.1")
    implementation("androidx.media3:media3-session:1.10.1")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.1")

    // DI (Hilt/Koin)
    // implementation("com.google.dagger:hilt-android:2.51")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
```

> **Kotlin 2.x / Compose-Plugin**: Die `composeOptions { kotlinCompilerExtensionVersion }`-Zeile entfällt — bei Kotlin 2.x wird das Compose-Compiler-Gradle-Plugin (`org.jetbrains.kotlin.plugin.compose`) verwendet. Root-`build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application") version "8.13.0" apply false
    id("org.jetbrains.kotlin.android") version "2.1.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.21" apply false
}
```

> **tv.material3-API**: In tv-material 1.1.0 heißt die Root-Composable `MaterialTheme` (Package `androidx.tv.material3`), *nicht* `TvMaterialTheme`.

---

## 5. ProGuard / R8 Rules (`app/proguard-rules.pro`)

```pro
# Keep Leanback / Compose TV
-keep class androidx.leanback.** { *; }
-keep class androidx.tv.** { *; }

# ExoPlayer
-keep class com.google.android.exoplayer2.** { *; }

# Serialization (kotlinx/json/moshi/gson)
-keep class kotlinx.serialization.** { *; }

# Hilt / Dagger
-keep class dagger.hilt.** { *; }

# App-spezifisch: Model-Klassen, Player, Repository
-keep class com.phoenizia.tv.model.** { *; }
-keep class com.phoenizia.tv.player.** { *; }
-keep class com.phoenizia.tv.repository.** { *; }

# Remove logging in Release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

---

## 6. Build Commands

| Ziel | Command | Output |
|------|---------|--------|
| **Debug APK** (Test auf Gerät) | `./gradlew assembleDebug` | `app/build/outputs/apk/debug/app-debug.apk` |
| **Release AAB** (Amazon Appstore) | `./gradlew bundleRelease` | `app/build/outputs/bundle/release/app-release.aab` |
| **Release APK** (Sideload) | `./gradlew assembleRelease` | `app/build/outputs/apk/release/app-release.apk` |
| **Clean + Build** | `./gradlew clean bundleRelease` | — |
| **Lint prüfen** | `./gradlew lintRelease` | `app/build/reports/lint-results-release.html` |

**PowerShell (Windows):**
```powershell
.\gradlew.bat bundleRelease
```

---

## 7. Auf FireStick installieren (Test)

### ADB über WLAN (Fire TV Developer Options → ADB Debugging → AN)

```bash
# IP herausfinden: Settings → My Fire TV → About → Network
adb connect 192.168.x.x:5555
adb install -r app/build/outputs/apk/debug/app-debug.apk
# oder Release
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Logs ansehen
```bash
adb logcat -s "PhöniziaTV" "ExoPlayer" "AndroidRuntime" "*:E"
```

---

## 8. Amazon Appstore Submission

1. **AAB hochladen** in Developer Console → "App hinzufügen" → "Android App"
2. **Assets vorbereiten** (siehe `FIRESTICK_SPECS.md`):
   - App Icon: 1280×720 (Amazon), 512×512 (Google)
   - Banner: 320×180 (Leanback Launcher)
   - Screenshots: 1920×1080 (TV), 1280×720 (Tablet)
   - Feature Graphic: 1024×500
3. **Content Rating** (USK/PEGI) ausfüllen
4. **Targeting**: Fire TV Geräte auswählen
5. **Submit for Review**

---

## 9. CI/CD (Optional — GitHub Actions)

`.github/workflows/release.yml`:

```yaml
name: Release Build

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Setup JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: 21
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
      - name: Keystore from Secrets
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > phoenizia-release.keystore
          cat > keystore.properties <<EOF
          storeFile=phoenizia-release.keystore
          storePassword=${{ secrets.STORE_PASS }}
          keyAlias=phoenizia
          keyPassword=${{ secrets.KEY_PASS }}
          EOF
      - name: Build Release AAB
        run: ./gradlew bundleRelease
      - name: Upload AAB Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-release.aab
          path: app/build/outputs/bundle/release/app-release.aab
```

**Secrets in GitHub repo settings** → `KEYSTORE_BASE64`, `STORE_PASS`, `KEY_PASS`.

---

## 10. Häufige Fehler & Fixes

| Fehler | Ursache | Fix |
|--------|---------|-----|
| `Keystore not found` | Pfad falsch | `storeFile=../phoenizia-release.keystore` relativ zu `app/` |
| `Duplicate class` | Leanback + Compose TV beide aktiv | Nur **eines** nutzen |
| `INSTALL_FAILED_NO_MATCHING_ABIS` | Emulator/Device arch mismatch | `abiFilters` prüfen, FireStick = arm64-v8a |
| `Banner not found` | `android:banner` fehlt | `res/drawable-xhdpi/banner.png` 320×180 |
| `Touchscreen required` | Manifest falsch | `android.hardware.touchscreen="false"` |
| `ProGuard removed Player` | Rules fehlen | ExoPlayer Rules in `proguard-rules.pro` |

---

## 11. Versionierung

```kotlin
// app/build.gradle.kts
defaultConfig {
    versionCode = 1000001 // major*1000000 + minor*1000 + patch
    versionName = "1.0.0"
}
```

**SemVer**: `MAJOR.MINOR.PATCH` — `versionCode` monotone steigend.

---

## 12. Nützliche Aliases (`.bashrc` / `.zshrc` / PowerShell Profile)

```bash
alias tv-debug='./gradlew installDebug'
alias tv-release='./gradlew bundleRelease'
alias tv-lint='./gradlew lintRelease'
alias tv-log='adb logcat -s "PhöniziaTV" "ExoPlayer" "*:E"'
```

---

**Stand**: 2026-07-22 — Für Phönizia-TV FireStick Build.
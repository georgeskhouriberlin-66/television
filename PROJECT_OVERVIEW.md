# Phönizia-TV — Project Overview

## Grundinformationen

| Property | Wert |
|----------|------|
| **App-Name** | Phönizia-TV |
| **Paket** | `com.phoenizia.tv` (Beispiel) |
| **Typ** | IPTV / OTT Streaming App |
| **Target Devices** | Amazon Fire TV Stick (Gen 2–4K Max), Fire TV Cube, Android TV |
| **Min SDK** | 21 (Android 5.0 / Fire OS 5) |
| **Target SDK** | 34 (Android 14) |
| **Sprache** | Deutsch (Primär), Englisch (Fallback) |
| **Store** | Amazon Appstore (Primär), Google Play (Sekundär) |

## Status Quo

- **Codebase**: Fast fertig, **sehr gute/unique Architektur** – **nur UI-Feinschliff + Build** offen
- **Funktionslogik**: **Unberührt lassen** – keine Änderungen an Business-Logik, State, Networking, Player-Core
- **Offen**: Abstände, Farben, Button-Rahmen, Konsistenz, Leanback-Banner, Android-Release-Build

## Tech Stack (Entscheidung treffen)

> **WICHTIG**: Stack im echten Projekt prüfen und hier eintragen.

| Layer | Option A | Option B | Entscheidung |
|-------|----------|----------|--------------|
| **UI** | Jetpack Compose for TV (Material3) | Classic Views + Leanback (`BrowseFragment`, `DetailsFragment`) | ☐ |
| **Language** | Kotlin | Kotlin + Java (Legacy) | ☐ |
| **Architecture** | MVVM + Flow/StateFlow | MVI / Redux | ☐ |
| **DI** | Hilt / Koin | Manual | ☐ |
| **Media Player** | ExoPlayer (Media3) | MediaPlayer (Legacy) | ☐ |
| **Build** | Gradle Kotlin DSL (`.kts`) | Groovy DSL | ☐ |
| **CI/CD** | GitHub Actions / Bitrise / GitLab | Lokal only | ☐ |

## Ziel dieser Phase

1. **Design-System** finalisieren (Tokens, Spacing, Colors, Typography, Motion)
2. **UI-Audit** aller Screens → Inkonsistenzen beheben (nur Styles/Layouts)
3. **Stitch-Integration** für schnelle UI-Iteration auf Komponenten-Ebene
4. **FireStick-Ready** Manifest, Banner, Leanback, D-Pad-Navigation, Overscan
5. **Signed Release Build** (AAB für Amazon Appstore, APK für Sideload/Test)
6. **Checkliste** für Store-Submission abarbeiten

## Key Constraints

- **Keine Logik-Änderungen** – nur `res/`, `ui/`, `theme/`, `compose/`, `layout/`
- **Fire OS 5/6/7 Support** – keine APIs > Level 25 ohne Runtime-Check
- **Leanback Launcher** – `android:banner` (320×180) zwingend
- **D-Pad Only** – keine Touch-Events, Fokus-Management sauber
- **Performance** – 60fps auf Fire Stick 4K Max, Start < 2s (Cold)

## Nächste Schritte

1. Stack in `ARCHITECTURE.md` eintragen
2. `BUILD_GUIDE.md` für lokalen Build nutzen
3. `FIRESTICK_SPECS.md` als Checkliste für Manifest/Resources
4. `DESIGN_SYSTEM.md` als Single Source of Truth für UI-Feinschliff
5. `STITCH_INTEGRATION.md` für Designer/Dev-Handoff
6. `CHECKLIST_RELEASE.md` vor jedem Release durchgehen
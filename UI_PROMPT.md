# UI-Feinschliff Prompt — Copy-Paste für Phönizia-TV Hauptprojekt

> **Diesen Prompt in den Chat des echten Projekts kopieren.**
> Liefert UI-Feinschliff + Android-Build ohne Funktionscode-Änderungen.

---

```
## Aufgabe: UI-Feinschliff + Android-Build (nur visuell)

**Kontext:**
- Phönizia-TV App existiert, ist fast fertig, Code ist sehr gut/unique
- Nötig: grafischer Feinschliff (Abstände, Farbanpassung, Button-Rahmen, Konsistenz)
- Android-Build finalisieren
- Stitch für UI-Iteration mit einbeziehen
- KEINE Änderungen an Funktions-Code

---

## Was zu tun ist:

1. **Codebase scannen** – bestehende UI-Komponenten, Theme-System, Design-Tokens verstehen
2. **Design-Audit** – inkonsistente Spacings, Farben, Border-Radius, Button-States aufdecken
3. **Design-System extrahieren/vereinheitlichen** – Token-Schema (Farben, Spacing, Typo, Radius, Shadows, Motion) als Single Source of Truth
4. **Stitch-Integration** – für einzelne Screens/Komponenten Stitch-Prompts generieren, Ergebnisse als CSS/Code-Fragmente zurückgeben (nicht ganze App neu)
5. **Feinschliff anwenden** – nur UI-Dateien (Styles, Themes, Layout-XML/Compose/JSX)
6. **Android-Build** – Gradle/SDK/Keystore prüfen, Release-Build laufen lassen, Store-Assets prüfen

---

## Constraints

| ✅ Erlaubt | ❌ Verboten |
|-----------|------------|
| CSS/Style/Theme-Dateien | Business-Logik, State-Management, API-Calls |
| Layout-Dateien (XML, Compose, JSX) | Datenmodelle, Repository/Service-Klassen |
| Design-Token-Dateien | Navigation-Logik (nur visuell anpassen) |
| Stitch-Prompts für Komponenten | Bestehende Architektur ändern |
| Gradle/Build-Konfiguration | Test-Code ändern (außer Snapshots aktualisieren) |

---

## Output-Erwartung

1. **Audit-Report** (was ist inkonsistent)
2. **Design-Token-Datei** (einheitliches Design-System)
3. **Stitch-Prompts** pro Screen/Komponente (copy-paste ready)
4. **Diff/Patches** ausschließlich für UI-Dateien
5. **Build-Status** + APK/AAB-Pfad

---

## Referenz: Aktuelle Brand-Vorgaben

```
Brand:    Phönizia-TV
Farben:   #0F0F23 (BG Deep)
          #16162E (Surface)
          #1B1B30 (Elevated)
          #CA8A04 (Gold Akzent)
          #EAB308 (Gold Hover)
          #A16207 (Gold Dim)
          #F5F5F0 (Text Primär)
          #B8B8C8 (Text Sekundär)
          #88889A (Text Muted)
          #2A2A4A (Border Subtle)
          #35355A (Border Default)
          #EF4444 (Error / LIVE)

Fonts:    Cinzel Decorative Black 900 (Brand/Display)
          Cinzel Decorative Regular 400 (Subtitle)
          Inter 300-700 (UI, Body, Buttons)

Spacing:  8dp Raster (8/16/24/32/48/64dp)
Radius:   8-12dp (Cards, Buttons)
Motion:   150-400ms, FastOutSlowIn / Spring
Shadow:   Gold Glow (0 0 24px #CA8A04 35%)
Layout:   Overscan 48dp Safe Area
Platform: Fire TV Stick, D-Pad Navigation, Leanback
```
```

---

**Verwendung:** Kopieren + in den Chat des echten Phönizia-TV Projekts einfügen. Der Agent scannt dann die reale Codebase und führt nur UI/Build-Arbeiten aus.
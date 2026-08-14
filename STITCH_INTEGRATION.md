# Stitch Integration — Phönizia-TV UI Iteration

> **Stitch (Google Labs)** ist ein AI-native UI Design Tool: **Prompt → UI-Design + HTML/CSS + Figma-Export**.
> Nutzung für schnelle UI-Iteration auf **Komponenten-Ebene** – nicht für ganze Screens, nicht für App-Code.

---

## 1. Workflow: Stitch in der Phönizia-TV-Entwicklung

```
Problem identifizieren                    ← Codebase scannen, Inkonsistenz finden
    │
    ├─► Stitch-Prompt formulieren          ← Prompt-Templates unten
    │       │
    │       ▼
    │   Stitch generiert Design            ← HTML/CSS + Figma-Link
    │       │
    │       ▼
    │   Feedback / Anpassen               ← Prompt verfeinern
    │       │
    │       ▼
    ├─► Design extrahieren (CSS, Tokens)   ← Farben, Spacing, Border-Radius, Typo
    │       │
    │       ▼
    └─► In App übertragen                 ← Token/Theme updaten, XML/Compose anpassen
```

## 2. Wann Stitch nutzen – wann NICHT

| ✅ Stitch geeignet | ❌ Nicht geeignet |
|--------------------|------------------|
| Einzelne Komponenten (Karte, Button, Header) | Ganze App (zu komplex, zu generic) |
| Farb-/Spacing-/Layout-Entscheidungen | Funktionslogik (Player, Navigation) |
| Design-Varianten vergleichen (Look & Feel) | Android-spezifisches XML/Compose generieren |
| Inspiration für Mood/Stil (Gold+Dark+Cinzel) | Finale Produktions-Assets (die kommen aus der App) |
| Schnelles Prototyping von UI-States | DRM, ExoPlayer, Network-Integration |
| CSS → Tokens extrahieren | Release-Build, Signing, Store-Submission |

## 3. Prompt-Templates (Copy-Paste)

### Template A: Komponenten-Design

```
Design a [Component] for a TV streaming app called "Phönizia-TV".
Platform: Android TV / Fire TV (D-Pad navigation, no touch).
Style: Dark OLED background (#0F0F23), gold accent (#CA8A04), deep purples (#1E1B4B).
Font: Cinzel Decorative Black for brand elements, Inter for body text.
Context: Used in a [Page/Grid/Dialog] for [Purpose].
Key requirement: [Focus state, spacing, layout detail].
Output as: CSS with design tokens + HTML mockup.
```

**Beispiel – Channel Card:**
```
Design a channel card component for a TV streaming app called "Phönizia-TV".
Platform: Android TV / Fire TV (D-Pad focus, remote control).
Style: Dark OLED background #0F0F23, cards #1B1B30, gold accent #CA8A04 for focus ring.
Font: Cinzel Decorative Black for channel names, Inter for metadata.
Component: 16:9 thumbnail area, channel name (Cinzel), category badge, LIVE indicator.
State: Focus card has gold border + translateY(-4px) + glow shadow.
Output: HTML + CSS with clean design tokens, responsive grid.
```

### Template B: Farbe / Akzent testen

```
Compare these three accent colors for a dark-mode TV streaming app
(dark background #0F0F23, surface #16162E):
- Gold #CA8A04 (current)
- Amber #F59E0B (alternative)
- Warm orange #F97316 (alternative)

Show three small mockups of a channel card with each accent,
focusing on: border on focus, LIVE badge, and category chip.
Add WCAG contrast ratio for each against the dark backgrounds.
```

### Template C: Header / Branding

```
Design a top-left brand header for a TV streaming app called "Phönizia-TV":
- Round logo (gold coin on white, 48px)
- Below/right: "PHÖNIZIA" in Cinzel Decorative Black 900, gold (#CA8A04)
- Below that: "— TV —" in Cinzel Decorative Regular 400, muted gold (#88889A)
- Background blends from #16162E to transparent
- Fixed position top, blur-backdrop glass effect
Output: HTML/CSS with the font styling and positioning.
```

### Template D: Button / Fokus (wichtig für FireStick!)

```
Design a CTA button for Fire TV (D-Pad navigation only):
- Default: solid gold #CA8A04 background, dark text #0F0F23
- Focus: gold border 2px, gold glow shadow (#CA8A04 40%), slight scale
- Press: gold dim #A16207 background
- Disabled: #2A2A4A background, #5A5A6E text
- Rounded (12dp radius), min width 160dp, height 48dp
- Font: Inter SemiBold 16dp
Output: CSS with all states + HTML mockup.
```

### Template E: Skeleton / Loading

```
Design a loading skeleton for a channel card (Fire TV app, dark theme):
- 16:9 placeholder rectangle with shimmer gradient animation
- Two text lines below (shimmer bars, 70% and 50% width)
- Colors: base #1B1B30, shimmer highlight #232340
- Shimmer moves left-to-right over 1.5s
- No text visible during loading
Output: Pure CSS animation + HTML structure.
```

## 4. Stitch verwenden

### Per Kommandozeile (Stitch MCP)
```bash
# Stitch ist in opencode.jsonc als MCP-Server konfiguriert:
npx @_davideast/stitch-mcp auth  # Einmalig OAuth2-Login
```

### Per Web UI
Öffne Stitch direkt im Browser → Prompt aus den Templates oben einsetzen → Ergebnis als CSS/HTML exportieren.

### Ergebnis-Verarbeitung
1. **CSS Tokens** aus Stitch extrahieren und in `UI/Colors.kt`, `UI/Spacing.kt` übertragen
2. **HTML-Strukturen** als Inspiration für Compose/XML-Layouts nutzen (nicht 1:1 kopieren)
3. **Stitch-Link** (Figma-Export) als Referenz für Designer

## 5. Stitch → App-Code Mapping

| Stitch Output | App-Äquivalent |
|---------------|----------------|
| `--accent-gold: #CA8A04` | `Color.kt: val Gold = Color(0xFFCA8A04)` |
| `border: 2px solid focus` | `TvFocusableCard: Modifier.border(2.dp, Gold)` |
| `grid-template-columns: repeat(5, 1fr)` | `TvLazyVerticalGrid(columns = Cells.Fixed(5))` |
| `padding: 16px` | `Modifier.padding(Spacing.md)` |
| `font-family: 'Cinzel Decorative', serif; font-weight: 900` | `TextStyle(fontFamily = cinzelDecorative, fontWeight = Black)` |
| `box-shadow: 0 0 24px rgba(202,138,4,0.35)` | `Modifier.shadow(elevation = 8.dp, spotColor = Gold)` |
| `@keyframes shimmer { ... }` | `enum ShimmerState { Idle, Loading } → animateFloat` |

## 6. Anti-Patterns (Vermeiden)

| ❌ Falsch | ✅ Richtig |
|-----------|------------|
| Stitch gesamte App generieren lassen | Nur einzelne Komponenten/States |
| Stitch-HTML direkt in Compose einbetten | Design-Elemente extrahieren, nicht das HTML |
| Stitch alle 5 Minuten neu fragen | Einen Prompt pro Iteration, dann umsetzen |
| Stitch-Ergebnis als "final" betrachten | Stitch ist Inspiration, nicht Production-Ready |
| Auf Stitch für Logik warten | Nur UI-Oberfläche, nie Funktionalität |

## 7. Referenz: Aktuelle Brand-Vorgaben (für Stitch-Prompts)

```
Brand:    Phönizia-TV
Farben:   #0F0F23 (BG), #16162E (Surface), #1B1B30 (Elevated)
          #CA8A04 (Gold Akzent), #EAB308 (Gold Hover)
          #F5F5F0 (Text Primär), #B8B8C8 (Text Sekundär)
Fonts:    Cinzel Decorative Black 900 (Brand)
          Cinzel Decorative Regular 400 (Subtitle)
          Inter 300-700 (UI, Body)
Stil:     Dark OLED, Motion-Driven, Fokus-Ring Gold, Overscan 48dp
Platform: Fire TV Stick / Android TV, D-Pad, Leanback Launcher
```

---

**Stand**: 2026-07-22 — Für Phönizia-TV Stitch Integration.
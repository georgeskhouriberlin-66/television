# Design System — Phönizia-TV

> **Single Source of Truth für alle visuellen Entscheidungen.**
> Basis: **Finaler Web-Stand** (`index.html` @ `dev/television`, Stand 2026-07-31)
> — Nächtliches Phönizia-Theme auf purem Schwarz.

---

## 1. Design Tokens

### 1.1 Farben (Dark — OLED Optimiert)

**Palette: Phönizia Night** (aus `:root` des finalen Web-Stands)
| Rolle | Hex | CSS-Variable | Verwendung |
|-------|-----|--------------|------------|
| **Background** | `#000000` | `--bg` | Screen-Hintergrund, Video-Letterbox |
| **Surface 1** | `rgba(6,9,18,.96)` | `--bg2` | Cards, Sidebar, Setup-Panels |
| **Surface 2** | `rgba(10,14,24,.95)` | `--bg3` | Kacheln, eingeklappte Channel-Info |
| **Accent (Cyan)** | `#00D4FF` | `--acc` | **Primär-Akzent**: Fokus-Kachel, aktive Pill, Buttons, Lade-Status |
| **Accent Dim** | `rgba(0,212,255,.12)` | `--acc2` | Subtile Cyan-Tints (ausgewählte Builtin-Buttons) |
| **Gold** | `#F5C218` | `--gold` | **Brand-Akzent**: Fokus-Border, Logo, Favoriten-Stern, Channel-Nummern-Overlay |
| **Rot (LIVE)** | `#FF4455` | `--red` | LIVE-Punkt, Fehler |
| **Grün (OK)** | `#39E09B` | `--grn` | Erfolgs-Status |

| Text | | | |
| **Primary** | `#FFFFFF` | `--txt` | Überschriften, Kachel-Namen (fokussiert: invertiert schwarz) |
| **Secondary** | `#A0B8D0` | `--txt2` | Fließtext, Load-Text |
| **Muted** | `#3A5070` | `--txt3` | EPG-Zeile, Kategorien, Metadaten |

> ⚠️ **Abweichung von alter Spec:** Früheres "Theater/Cinema Dark" (`#0F0F23`-Bg, Gold `#CA8A04`, Inter) ist **verworfen**. Maßgeblich ist obige Palette.

**Hex → Theme-Datei (Kotlin/Compose-Beispiel):**
```kotlin
// Color.kt
val NightBlack = Color(0xFF000000)
val NightSurface = Color(0xCC060912)        // rgba(6,9,18,.96)
val NightSurfaceAlt = Color(0xF20A0E18)     // rgba(10,14,24,.95)
val Accent = Color(0xFF00D4FF)              // Cyan
val AccentDim = Color(0x1F00D4FF)           // rgba(0,212,255,.12)
val Gold = Color(0xFFF5C218)
val LiveRed = Color(0xFFFF4455)
val OkGreen = Color(0xFF39E09B)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFFA0B8D0)
val TextMuted = Color(0xFF3A5070)

private val DarkColorScheme = darkColorScheme(
    primary = Accent,
    onPrimary = NightBlack,
    primaryContainer = AccentDim,
    secondary = Gold,
    onSecondary = NightBlack,
    background = NightBlack,
    surface = NightSurface,
    surfaceVariant = NightSurfaceAlt,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
    error = LiveRed,
    outline = Gold,
    outlineVariant = TextMuted,
)
```

### 1.2 Spacing Scale (8-Point-Grid)

| Token | px/dp | Verwendung |
|-------|-------|------------|
| `--space-4xs` | 2dp | Minimale Abstände |
| `--space-3xs` | 4dp | Icon-Innenabstand, Badges |
| `--space-2xs` | 6dp | Subtiles Padding |
| `--space-xs` | 8dp | **Basis-Einheit** |
| `--space-sm` | 12dp | Small Padding |
| `--space-md` | 16dp | **Card-Padding, Grid-Gap** |
| `--space-lg` | 24dp | Section-Abstand |
| `--space-xl` | 32dp | Screen-Edge-Padding |
| `--space-2xl` | 48dp | Große Sektionen |
| `--space-3xl` | 64dp | Content-Max-Breite |

```kotlin
// Tokens.kt
object Spacing {
    val xs = 8.dp
    val sm = 12.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
    val xxxl = 64.dp
}
```

### 1.3 Border Radius

> Web: `--phz-r-sm:6px`, `--phz-r-md:10px`, `--phz-r-lg:12px`

| Token | dp | Verwendung |
|-------|----|------------|
| `--phz-r-sm` | 6dp | Logo-Halter, Kategorie-Pills, kleine Chips |
| `--phz-r-md` | 10dp | **Standard-Cards** (Channel-Items, Buttons, Overlays) |
| `--phz-r-lg` | 12dp | Hero-Cards, Player, Dialoge |
| `--radius-full` | 9999dp | Toggles, Avatare, Badges |

### 1.4 Shadows (Elevation)

| Token | px (x/y/blur/spr) | Verwendung |
|-------|-------------------|------------|
| `--shadow-sm` | 0 2 4 0 | Subtile Karten |
| `--shadow-md` | 0 4 12 0 | Cards, Buttons |
| `--shadow-lg` | 0 8 24 0 | Dialoge, Player |
| `--shadow-xl` | 0 16 48 0 | Modale Overlays |
| `--shadow-gold` | 0 0 24px `#CA8A04`55 | Fokus/Hover-Glow |

### 1.5 Motion & Timing

| Typ | Dauer | Easing | Verwendung |
|-----|-------|--------|------------|
| **Fast** | 150ms | `ease-out` | Hover/Fokus-Glow, Kategorie-Pills, Farbwechsel |
| **Med** | 220ms | `ease-in-out` | Channel-Logo-Übergänge (width/height), Overlays |
| **Slow** | 300ms | `ease-in-out` | Channel-Info-Bar ein-/ausfahren, Load-Overlay |
| **Snap** | 350ms | `cubic-bezier(.34,1.56,.64,1)` | Fokus-Snap-In (overshoot), Kachel-Content-Slide |
| **LIVE Pulse** | 1500ms | `ease-in-out` | LIVE-Punkt pulsieren (opacity .35→1) |

> Web-CSS-Variablen: `--phz-dur-fast:.15s`, `--phz-dur-med:.22s`, `--phz-dur-slow:.3s`.
> Snap-In-Keyframe: `scale(.92)→1` + opacity 0→1 in `.35s` mit Overshoot-Bezier.
> Content-Slide (`.ci`): `translateY(24px)→0` in `.3s`, rückwärts `-24px`.

```kotlin
// Motion.kt
object Motion {
    val fast = 150.ms
    val med = 220.ms
    val slow = 300.ms
    val snap = 350.ms
    val livePulse = 1500.ms

    val fastOutSlowIn = FastOutSlowInEasing
    val snapOvershoot = CubicBezierEasing(0.34f, 1.56f, 0.64f, 1f)
    val tvSpring = spring(dampingRatio = 0.6f, stiffness = 500f)
}
```

### 1.6 Typography

> Web: `--f:'Outfit',sans-serif` (UI), `--fc:'Cinzel',serif` (Brand/Display), `--fm:'DM Mono',monospace` (Nummern, EPG, Kategorien, Zeitcodes).

| Rolle | Font | Weight | Size | Zeilenhöhe |
|-------|------|--------|------|------------|
| **Display (Brand)** | Cinzel | 900 (Black) | 32–48dp | 1.1 |
| **Headline L** | Cinzel | 700 (Bold) | 28dp | 1.2 |
| **Sender-Name (fokussiert)** | Outfit | 900 (Black) | 22dp | 1.2 |
| **Sender-Name (normal)** | Outfit | 700 (Bold) | 16dp | 1.2 |
| **Body L** | Outfit | 400 (Regular) | 18dp | 1.5 |
| **Body M** | Outfit | 400 (Regular) | 16dp | 1.5 |
| **Body S** | Outfit | 400 (Regular) | 14dp | 1.5 |
| **Kanal-Nummer** | DM Mono | 800 (ExtraBold) | 22dp | 1.0 |
| **Kanal-Nummer (fokussiert)** | DM Mono | 900 (Black) | 36dp | 1.0 |
| **EPG-Zeile** | DM Mono | 400 (Regular) | 12dp | 1.4 |
| **Kategorie-Pill / Label** | DM Mono | 400 (Regular) | 12dp | 1.3 |

> Kanal-Nummern sind **bewusst groß/kräftig** (22dp/800, fokussiert 36dp/900) für
> Ablesbarkeit aus 2,5–3 m — User-Anforderung aus der Web-Finalisierung.

```kotlin
// Typography.kt
val TvTypography = Typography(
    displayLarge = TextStyle(        // Brand "PHÖNIZIA"
        fontFamily = cinzel,
        fontWeight = FontWeight.Black,
        fontSize = 48.sp,
        lineHeight = 52.8.sp,
        letterSpacing = 0.08.em,
    ),
    displayMedium = TextStyle(
        fontFamily = cinzel,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 38.4.sp,
        letterSpacing = 0.02.em,
    ),
    titleLarge = TextStyle(          // Sender-Name fokussiert
        fontFamily = FontFamily.SansSerif, // Outfit
        fontWeight = FontWeight.Black,
        fontSize = 22.sp,
        lineHeight = 26.4.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 18.sp,
        lineHeight = 27.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 21.sp,
    ),
    labelLarge = TextStyle(          // Buttons
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        lineHeight = 20.8.sp,
    ),
    labelSmall = TextStyle(          // Kategorie-Pills, Captions
        fontFamily = FontFamily.Monospace, // DM Mono
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 15.6.sp,
        letterSpacing = 0.08.em,
    ),
)
```

**Font-Files:**
```
app/src/main/res/font/
├── cinzel_black.ttf
├── cinzel_bold.ttf
├── outfit_variable.ttf            # 300–900
└── dm_mono_variable.ttf           # 400–500
```

Oder via Google Fonts Provider (AndroidX `DownloadableFonts`):
```xml
<!-- res/font/cinzel_black.xml -->
<font-family xmlns:app="http://schemas.android.com/apk/res-auto"
    app:fontProviderAuthority="com.google.android.gms.fonts"
    app:fontProviderPackage="com.google.android.gms"
    app:fontProviderQuery="name=Cinzel&weight=900" />
```

---

## 2. Layout-Richtlinien

### 2.1 Raster (TV-optimiert)

| Breakpoint | Spalten | Karten | Card-Breite | Edge-Padding |
|------------|---------|--------|-------------|--------------|
| < 720px (Fire Stick Lite) | 2–3 | klein | ~200dp | 32dp |
| 720–960px | 3–4 | mittel | ~220dp | 32dp |
| 960–1280px (FHD) | 4–5 | normal | ~240dp | 48dp |
| 1280–1920px (4K) | 5–7 | groß | ~260dp | 48dp |
| > 1920px | 7+ | groß | ~280dp | 64dp |

### 2.2 Safe Area (Overscan)

Fire TV Geräte haben 3–5% Overscan. **48dp Margin** auf allen Seiten einhalten.

```kotlin
// Compose
@Composable
fun TvSafeContainer(content: @Composable () -> Unit) {
    val insets = WindowInsets.systemBars.only(WindowInsetsSides.Bottom + WindowInsetsSides.Top)
    Box(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(insets)
    ) { content() }
}
```

### 2.3 Header-Höhe

- **Fester Header** (oben eingeklappt): 72dp
- **Erweiterter Header** (Fokus auf Brand): 120dp
- **Scroll-Verhalten**: Header bleibt fixed oder scrollt mit (leanback-typisch: fixiert).

---

## 3. Button-States

> Web: `.ci.focused` = **Accent-Cyan-Hintergrund + Gold-Border 3.5px + Innenschatten**, Text schwarz.
> Aktiv-Pills: Cyan-Hintergrund, Gold-Border. Primär-Buttons: Cyan, Text schwarz.

| State | Hintergrund | Border | Text | Schatten |
|-------|-------------|--------|------|----------|
| **Default (Kachel)** | `rgba(10,14,24,.95)` | 1px `rgba(255,255,255,.08)` | `#A0B8D0` | Keiner |
| **Fokussiert (Kachel)** | `#00D4FF` | 3.5px `#F5C218` | `#000000` | `0 0 8px rgba(245,194,24,.45)`, `0 0 25px rgba(245,194,24,.18)`, inset 2px `#000` |
| **Aktive Pill/Kachel** | `#00D4FF` | 1px `#F5C218` | `#000000` | — |
| **Primär-Button** | `#00D4FF` | — | `#000000` | `0 8px 24px rgba(0,212,255,.2)` |
| **Disabled** | `rgba(255,255,255,.05)` | — | `#3A5070` | — |

**Fokus-Ring spezifikation (Compose):**
```kotlin
// Fokussierte Kachel = Cyan-Fill + Gold-Rahmen + 2px innerer Schwarzrahmen
val focusedBorder = BorderStroke(3.5.dp, Gold)
// innerer "schwarzer" Kontrastrahmen:
val innerInset = BorderStroke(2.dp, NightBlack)

Modifier
    .focusable()
    .background(if (focused) Accent else NightSurfaceAlt, RoundedCornerShape(10.dp))
    .border(if (focused) focusedBorder else BorderStroke(1.dp, WhiteAlpha08))
    .scale(if (focused) 1.06f else 1f)
    .onFocusChanged { state -> focused = state.isFocused }
    .animateContentSize(tween(Motion.snap, easing = Motion.snapOvershoot))
```

> ⚠️ **Fokus-Verhalten ist Farbinversion, kein Ring:** Die fokussierte Kachel füllt sich
> komplett cyan mit goldener Border und invertiert ihren Text auf Schwarz. Kein
> separater Highlight-Ring wie im alten Design.

---

## 4. Channel Card Spezifikation

> Web-Äquivalent: `.ci` (Channel Item). **Zwei Modi: "near" (fokussiert) und "far" (restliche Liste).**

```
┌──────────────────────────┐  ← far: 58dp hoch / near: 160dp hoch (Fokus vergrößert)
│  [Logo 46×33dp]          │
│  Sender-Name  16dp/700   │  ← Outfit Bold; far: 13dp rgba(255,255,255,.5)
│  EPG-Zeile    12dp mono  │  ← DM Mono, muted; nur near
│  [Nummer] 22dp/800 mono  │  ← oben rechts, DM Mono ExtraBold
└──────────────────────────┘
```

**Fokus (`.ci.focused`):**
- Höhe: **160dp** (normal 100–130dp; `.near` 102px / `.far` 58px Desktop, mobile 61/41px)
- Hintergrund: Cyan `#00D4FF`, Border 3.5px Gold, Radius 10dp, innen 2px Schwarz
- Sender-Name: 22dp/900, **schwarz**
- Kanal-Nummer: 36dp/900, `rgba(0,0,0,.55)`
- Logo: 56×42dp
- Animation: Snap-In `scale(.92)→1` in 350ms Overshoot; Content-Slide `translateY(24px)`

**Nicht-fokussiert (`.ci.far`):** 58dp hoch, Name 13dp `rgba(255,255,255,.5)`, kein EPG, Nummer gedimmt.

---

**Stand**: 2026-07-31 — Synchronisiert mit finalem Web-Stand (`dev/television/index.html`).
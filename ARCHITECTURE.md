# Architektur — Phönizia-TV

> **Entscheidungen dokumentieren, damit spätere Änderungen nachvollziehbar sind.**

---

## 1. UI-Framework Entscheidung

| Kriterium | **Jetpack Compose for TV** | **Classic Views + Leanback** |
|-----------|----------------------------|------------------------------|
| **Status** | Modern, Google-recommended | Mature, stabil, viele Beispiele |
| **Leanback Parity** | `TvLazyColumn/Row`, `ImmersiveList`, `Carousel` | `BrowseFragment`, `DetailsFragment` |
| **D-Pad Fokus** | `Modifier.focusable()`, `FocusRequester` | Built-in in Presentern |
| **Theming** | Material3 `ColorScheme`, `Typography`, `Shapes` | `Theme.Leanback` + Styles XML |
| **Migration** | Neu schreiben / Interop | Bestehender Code nutzbar |
| **Performance** | Gut (Compose Compiler), Recomposition beachten | Sehr gut, bekannt |
| **Team Knowledge** | ✅ Ja | ☐ Nein |

### → ENTSCHEIDUNG: ✅ Jetpack Compose for TV

**Begründung:** Spec (ARCHITECTURE.md) ist bereits vollständig auf Compose ausgelegt
(Compose-NavGraph mit `@Serializable`, Material3-Theme, Compose-ViewModels). Die finale
Web-UI (IndexGrid mit Fokus-States, Kategorie-Filter-Pills) übersetzt sich 1:1 in
`TvLazyGrid` + `Modifier.focusable()`/`FocusRequester`. Zielgerät Fire Stick TV (Fire OS 7+,
API 29+) — Compose for TV ist seit 2023 stable und Google-recommended. Kein Alt-Code,
der Migration erfordert → Neu-Start auf Compose ist die sauberste Linie.

**Entschieden am:** 2026-07-31

---

## 2. Modul-Struktur

```
PhoeniziaTV/
├── app/                          # Application Module
│   ├── src/main/
│   │   ├── java/com/phoenizia/tv/
│   │   │   ├── PhoeniziaApplication.kt
│   │   │   ├── MainActivity.kt
│   │   │   ├── di/               # Hilt/Koin Modules
│   │   │   ├── navigation/       # NavGraph, Deep Links
│   │   │   ├── ui/
│   │   │   │   ├── theme/        # Design System (Tokens, Theme)
│   │   │   │   ├── components/   # Wiederverwendbare UI-Komponenten
│   │   │   │   ├── screens/      # Screen Composables / Fragments
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── player/
│   │   │   │   │   ├── settings/
│   │   │   │   │   ├── search/
│   │   │   │   │   └── category/
│   │   │   │   └── util/         # Focus, Insets, Extensions
│   │   │   ├── player/           # ExoPlayer Wrapper, MediaSession
│   │   │   ├── data/
│   │   │   │   ├── repository/   # ChannelRepository, EPGRepository
│   │   │   │   ├── source/       # ApiService, Database, Prefs
│   │   │   │   └── model/        # Data Classes (Channel, Program, etc.)
│   │   │   └── util/             # Extensions, Constants
│   │   ├── res/
│   │   │   ├── values/           # Colors, Dimens, Strings, Themes
│   │   │   ├── drawable/         # Icons, Banner, Shapes
│   │   │   ├── layout/           # (nur bei Classic Views)
│   │   │   ├── xml/              # shortcuts, media_session, backup
│   │   │   └── mipmap-*/         # Icons
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── core/                         # Optional: Shared Kernel (Common, Player-Core)
│   ├── common/
│   ├── player/
│   └── network/
├── buildSrc/                     # Build Logic, Convention Plugins
├── gradle/
│   └── libs.versions.toml        # Version Catalog
├── .github/workflows/            # CI/CD
├── keystore.properties           # Local only (.gitignore)
├── phoenizia-release.keystore    # Local only (.gitignore)
├── settings.gradle.kts
└── gradle.properties
```

---

## 3. Dependency Injection

| Option | Bibliothek | Setup-Aufwand | Runtime-Overhead |
|--------|------------|---------------|------------------|
| **Hilt** | `com.google.dagger:hilt-android` | Mittel (Annotation Processor) | Gering (Compile-time) |
| **Koin** | `io.insert-koin:koin-android` | Gering (Kein APT) | Sehr gering |
| **Manual** | — | Gering (kleine Apps) | Keiner |

### → ENTSCHEIDUNG: ✅ Koin

**Begründung:** Kleine App (ein Modul), Koin ohne Annotation-Processor = schnellerer Build,
weniger Boilerplate. Hilt wäre für ein Multi-Modul-Projekt die Wahl; hier reicht Koin.

**Entschieden am:** 2026-07-31

**Module (Beispiel Hilt):**
```kotlin
// app/src/main/java/com/phoenizia/tv/di/NetworkModule.kt
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideApiService(@Named("baseUrl") baseUrl: String): ApiService = Retrofit.Builder()
        .baseUrl(baseUrl)
        .addConverterFactory(MoshiConverterFactory.create())
        .build()
        .create(ApiService::class.java)
}
```

---

## 4. Navigation

| Stack | Bibliothek | Deep Links | Type-Safe |
|-------|------------|------------|-----------|
| **Compose** | `androidx.navigation:navigation-compose` | ✅ | ✅ (Serializables) |
| **Classic** | `androidx.leanback:leanback` + `Navigation` | ⚠️ | ❌ |

**NavGraph (Compose):**
```kotlin
@Serializable
sealed interface TvDestination {
    @Serializable data object Home : TvDestination
    @Serializable data class Player(val channelId: String) : TvDestination
    @Serializable data object Settings : TvDestination
    @Serializable data class Category(val id: String) : TvDestination
    @Serializable data object Search : TvDestination
}
```

---

## 5. State Management

| Pattern | Bibliothek | Use Case |
|---------|------------|----------|
| **MVVM + StateFlow** | `androidx.lifecycle:lifecycle-viewmodel-compose` | Standard, gut für TV |
| **MVI / Redux** | `mavericks` / `reducible` | Komplexe State-Machines |
| **Compose State** | `remember`, `mutableStateOf` | Lokale UI-State |

**ViewModel (Beispiel):**
```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val channelRepo: ChannelRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState

    init { loadChannels() }

    private fun loadChannels() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            channelRepo.getChannels()
                .onSuccess { _uiState.value = HomeUiState.Success(it) }
                .onFailure { _uiState.value = HomeUiState.Error(it.message) }
        }
    }
}

sealed interface HomeUiState {
    data class Success(val channels: List<Channel>) : HomeUiState
    data class Error(val message: String) : HomeUiState
    object Loading : HomeUiState
}
```

---

## 6. Player Architecture (ExoPlayer / Media3)

```
┌─────────────────────────────────────────────────────┐
│                    MediaController                   │
│  (MediaControllerCompat / MediaController)          │
└─────────────────────┬───────────────────────────────┘
                      │ MediaSession
                      ▼
┌─────────────────────────────────────────────────────┐
│                  MediaSessionCompat                  │
│  • PlaybackState (Play/Pause/Seek/FF/RW)            │
│  • MediaMetadata (Title, Art, Duration)             │
│  • Queue (Playlist/Channels)                        │
└─────────────────────┬───────────────────────────────┘
                      │ Player.ControlDispatcher
                      ▼
┌─────────────────────────────────────────────────────┐
│                   ExoPlayer Instance                 │
│  • MediaSource (HLS/DASH/Progressive)               │
│  • TrackSelector (Adaptive/Manual)                  │
│  • LoadControl (Buffering)                          │
│  • DRM (Widevine/PlayReady) via MediaDrm            │
└─────────────────────────────────────────────────────┘
```

**Wichtige Klassen:**
- `PhoeniziaPlayer` — Wrapper um `ExoPlayer`, exponiert `PlaybackControls`
- `MediaPlaybackService` — `MediaSessionService` (Media3) für Background-Audio
- `MediaNotificationProvider` — Lockscreen/Notification Controls

---

## 7. Data Layer

```
Repository (Interface)
    │
    ├─── ChannelRepository
    │       ├─── ApiSource (Retrofit + Moshi)
    │       ├─── CacheSource (Room / DataStore)
    │       └─── OfflineSource (Local JSON / M3U Parser)
    │
    ├─── EpgRepository
    │       └─── ApiSource + Cache
    │
    └─── SettingsRepository
            └─── DataStore (Preferences)
```

**Offline-First Strategy:**
1. Cache beim Start laden (Room/DataStore) → UI sofort
2. Background: API-Fetch → Diff → Cache aktualisieren → UI-Update
3. ExoPlayer: `CacheDataSource` für Segment-Caching (vorwärts/rewind)

---

## 8. Theming & Design System (nur UI, keine Logik)

**Location:** `app/src/main/java/com/phoenizia/tv/ui/theme/`

```
theme/
├── Color.kt          # Material3 ColorScheme (Light/Dark)
├── Typography.kt     # Material3 Typography (Display/Headline/Body/Label)
├── Shape.kt          # Material3 Shapes (Corner Sizes)
├── Motion.kt         # Animation Specs (Easing, Duration)
├── Theme.kt          # Theme Composable / Style XML
└── Tokens.kt         # Raw Design Tokens (Spacing, Z-Index, Breakpoints)
```

**→ Siehe `DESIGN_SYSTEM.md` für Token-Werte.**

---

## 9. Testing Strategy

| Ebene | Tool | Coverage-Ziel |
|-------|------|---------------|
| **Unit** | JUnit5 + MockK | > 80% (Repository, ViewModel, UseCases) |
| **Integration** | Robolectric / Compose Testing | Critical Paths (Player, Navigation) |
| **UI** | Compose UI Test / Espresso | Smoke Tests (Launch, Play, Settings) |
| **Device Farm** | Firebase Test Lab / AWS Device Farm | 5+ Fire TV Geräte |

---

## 10. Observability

| Bereich | Tool | Events |
|---------|------|--------|
| **Crashes** | Firebase Crashlytics / Sentry | All Uncaught |
| **Analytics** | Firebase Analytics / Custom | Screen View, Play Start, Error, Purchase |
| **Performance** | Firebase Performance | App Start, Player Init, Network Latency |
| **Logs** | Timber (Debug) → Logcat / Crashlytics (Release) | Structured JSON |

---

## 11. Offene Entscheidungen (Zum Ausfüllen)

| # | Thema | Optionen | Entscheidung | Datum |
|---|-------|----------|--------------|-------|
| 1 | UI Framework | Compose TV / Classic Leanback / Hybrid | ✅ Compose for TV | 2026-07-31 |
| 2 | DI | Hilt / Koin / Manual | ✅ Koin | 2026-07-31 |
| 3 | Navigation | Compose Nav / Leanback + Fragment | ✅ Compose Nav (type-safe `@Serializable`) | 2026-07-31 |
| 4 | State | MVVM+Flow / MVI / Compose State | ✅ MVVM + StateFlow | 2026-07-31 |
| 5 | Player Service | Media3 `MediaSessionService` / Legacy `MediaBrowserService` | ✅ Media3 `MediaSessionService` | 2026-07-31 |
| 6 | Offline Cache | Room / DataStore / MMKV / JSON Files | ☐ | |
| 7 | DRM | Widevine L1/L3 / PlayReady / ClearKey | ☐ | |
| 8 | CI/CD | GitHub Actions / Bitrise / GitLab / Lokal | ☐ | |

---

**Stand**: 2026-07-22 — Für Phönizia-TV Architektur-Dokumentation.
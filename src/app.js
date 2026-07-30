// === Auto-Detection Module ===
// Überwacht tinyurls.json auf neue Playlist-Einträge
// und integriert diese automatisch in den Player

const TINYURL_SOURCE = "https://raw.githubusercontent.com/georgeskhouriberlin-66/television/main/tinyurls.json";

let currentPlaylists = {};
let detectedPlaylists = [];
let watchInterval = null;

async function detectNewPlaylists() {
  try {
    const res = await fetch(TINYURL_SOURCE);
    const remote = await res.json();
    const localKeys = Object.keys(currentPlaylists);

    for (const [name, url] of Object.entries(remote)) {
      if (!localKeys.includes(name)) {
        console.log(`🔍 Neue Playlist erkannt: ${name} → ${url}`);
        detectedPlaylists.push({ name, url, detectedAt: new Date().toISOString() });
        onNewPlaylistDetected(name, url);
      }
    }

    if (detectedPlaylists.length > 0) {
      onNewPlaylistsFound(detectedPlaylists);
    }
    return detectedPlaylists;
  } catch (err) {
    console.warn("⚠️ Auto-Detection fehlgeschlagen:", err.message);
    return [];
  }
}

function onNewPlaylistsFound(newLists) {
  for (const pl of newLists) {
    currentPlaylists[pl.name] = pl.url;
  }
  localStorage.setItem("iptvPlaylists", JSON.stringify(currentPlaylists));
  showUIFeedback(`Neue Playlists: ${newLists.map(p => p.name).join(", ")}`);
  detectedPlaylists = [];
}

function showUIFeedback(msg) {
  const el = document.getElementById("playlist-status");
  if (el) el.textContent = `📡 ${msg}`;
}

function savePlaylistUrl(name, url) {
  currentPlaylists[name] = url;
  localStorage.setItem("iptvPlaylists", JSON.stringify(currentPlaylists));
}

function onNewPlaylistDetected(playlistName, playlistUrl) {
  savePlaylistUrl(playlistName, playlistUrl);
  loadPlaylists();
}

function startAutoDetection(intervalMs = 300000) {
  watchInterval = setInterval(detectNewPlaylists, intervalMs);
}

function stopAutoDetection() {
  if (watchInterval) clearInterval(watchInterval);
}

// AUTO-DETECTION MODULE END

// === Dynamic Playlist Loader ===
// Lädt die aktuelle Playlist-URLs aus tinyurls.json und synchronisiert
// erkannte neue Playlists mit dem lokalen Cache.

async function loadPlaylists() {
  const statusEl = document.getElementById("playlist-status");
  if (statusEl) statusEl.textContent = "Playlists werden aktualisiert…";

  try {
    const response = await fetch(TINYURL_SOURCE);
    const data = await response.json();

    const playlists = {
      arabic: data["arabic-iptv"] || data.arabic,
      gulf: data["gulf-iptv"] || data.gulf,
      usa: data["usa-iptv"] || data.usa,
      eastblock: data["eastblock-iptv"] || data.eastblock,
      germany: data["germany-iptv"] || data.germany,
      christian: data.christian || data["christian-iptv"],
      libanon: data.libanon || data["libanon-iptv"],
      'free-world': data['free-world'] || data["free-world-iptv"]
    };

    const valid = Object.fromEntries(Object.entries(playlists).filter(([, v]) => v));

    localStorage.setItem("iptvPlaylists", JSON.stringify(valid));
    currentPlaylists = valid;
    updatePlayer(valid);

    if (statusEl) statusEl.textContent = `✅ Playlists geladen (${Object.keys(valid).length} Regionen)`;
    console.log("✅ Playlists erfolgreich geladen und aktualisiert.");

    for (const [key, url] of Object.entries(data)) {
      const simpleKey = key.replace(/-iptv$/, "");
      if (!valid[simpleKey] && url) {
        console.log(`🔗 Neue Playlist erkannt: ${simpleKey || key} → ${url}`);
      }
    }

    return valid;
  } catch (error) {
    console.error("❌ Fehler beim Laden der TinyURLs:", error);
    const cached = localStorage.getItem("iptvPlaylists");
    if (cached) {
      const fallback = JSON.parse(cached);
      if (statusEl) statusEl.textContent = "⚠️ Offline-Modus: Verwende gespeicherte Playlists.";
      console.log("⚠️ Offline-Modus: Verwende gespeicherte Playlists.");
      updatePlayer(fallback);
      return fallback;
    }
    if (statusEl) statusEl.textContent = "❌ Keine Playlists verfügbar";
    return {};
  }
}

function updatePlayer(playlists) {
  Object.entries(playlists).forEach(([region, url]) => {
    console.log(`🔗 ${region.toUpperCase()} → ${url}`);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPlaylists);
  } else {
    loadPlaylists();
  }
  startAutoDetection();
}

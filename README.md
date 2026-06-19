# Television – Ultimate IPTV Automation

Automatisch generierte IPTV-Playlisten, alle 12 Stunden aktualisiert.

## Playlisten

| Playlist | Länder | EPG | TinyURL |
|----------|--------|-----|---------|
| `arabic.m3u` | LB, SY, EG, JO, AE, QA | ✅ | `https://tinyurl.com/288e72mm` |
| `gulf.m3u` | AE, QA, JO | ✅ | `https://tinyurl.com/2y6788nu` |
| `usa.m3u` | US | ✅ | `https://tinyurl.com/22xllnhv` |
| `eastblock.m3u` | RU, UA | ✅ | `https://tinyurl.com/25lmqukn` |
| `germany.m3u` | DE | ✅ | `https://tinyurl.com/2bfom2bu` |
| `christian.m3u` | – | ✅ | `https://tinyurl.com/25cwjmur` |

## Frontend Integration

`src/app.js` lädt automatisch die aktuellen Playlist-URLs aus `tinyurls.json` und erkennt neue Playlists (z. B. libanon), sobald sie im JSON auftauchen. Lokaler Cache im `localStorage`, Fallback bei Offline.

```html
<div id="playlist-status">Initialisiere Playlists…</div>
<script src="src/app.js"></script>
```
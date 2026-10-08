/* PhoeniciaTV HLS-Proxy — eine Datei, kein Build.
 *
 * Zweck: http://-Streams auf der HTTPS-Seite spielbar machen (Mixed-Content-Block umgehen).
 * Der Worker holt die Streams serverseitig und schreibt m3u8-Playlists so um, dass auch
 * Segmente/Keys/Unterplaylists wieder über den Worker laufen (relative URLs würden sonst
 * gegen die Worker-URL auflösen und brechen).
 *
 * Deploy (ca. 5 Minuten, Cloudflare-Account vorausgesetzt):
 *   1. npm i -g wrangler && wrangler login
 *   2. wrangler init --yes phoenicia-hls (oder: bestehendes Verzeichnis nehmen)
 *   3. diese Datei als worker/proxy.js ablegen, dazu minimal wrangler.toml:
 *        name = "phoenicia-hls"
 *        main = "worker/proxy.js"
 *        compatibility_date = "2024-01-01"
 *   4. wrangler deploy  → URL kopieren, z. B. https://phoenicia-hls.<account>.workers.dev/?url=
 *   5. URL in app/src/main/assets/index.html in HLS_PROXY eintragen, committen, pushen.
 *
 * Aufruf: GET <worker>/?url=<encodeURIComponent(stream-url)>
 */

'use strict';

const PROXY_PARAM = 'url';
const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

/* Reine Funktion (in node testbar): schreibt alle URIs einer m3u8 auf Proxy-URLs um. */
export function rewritePlaylist(text, targetUrl, proxyBase) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (!line || line[0] === '#') {
      out.push(line.replace(/URI="([^"]+)"/g, (m, u) => {
        try {
          return 'URI="' + proxyBase + encodeURIComponent(new URL(u, targetUrl).href) + '"';
        } catch (e) {
          return m;
        }
      }));
    } else {
      try {
        out.push(proxyBase + encodeURIComponent(new URL(line.trim(), targetUrl).href));
      } catch (e) {
        out.push(line);
      }
    }
  }
  return out.join('\n');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'GET') {
      return new Response('method not allowed', { status: 405, headers: corsHeaders() });
    }
    let target = null;
    try {
      target = new URL(new URL(request.url).searchParams.get(PROXY_PARAM));
    } catch (e) {
      return new Response('missing ?url=', { status: 400, headers: corsHeaders() });
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return new Response('only http(s)', { status: 400, headers: corsHeaders() });
    }

    const proxyBase = new URL(request.url).origin +
      new URL(request.url).pathname + '?' + PROXY_PARAM + '=';

    const fwd = { 'User-Agent': BROWSER_UA };
    const range = request.headers.get('range');
    if (range) fwd['Range'] = range;

    let upstream = null;
    try {
      upstream = await fetch(target.href, { headers: fwd, redirect: 'follow' });
    } catch (e) {
      return new Response('upstream fetch failed', { status: 502, headers: corsHeaders() });
    }

    const headers = new Headers(corsHeaders());
    const ct = upstream.headers.get('content-type') || '';
    const looksLikePlaylist =
      ct.indexOf('mpegurl') !== -1 || ct.indexOf('x-mpegurl') !== -1 ||
      /\.m3u8($|\?)/i.test(target.pathname);

    if (upstream.ok && looksLikePlaylist) {
      const text = await upstream.text();
      if (text.indexOf('#EXTM3U') !== -1) {
        headers.set('Content-Type', 'application/vnd.apple.mpegurl');
        headers.set('Cache-Control', 'no-store');
        return new Response(rewritePlaylist(text, target.href, proxyBase), {
          status: 200,
          headers
        });
      }
    }

    const passCt = upstream.headers.get('content-type');
    if (passCt) headers.set('Content-Type', passCt);
    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    headers.set('Cache-Control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};

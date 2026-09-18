// epg-generate.js — EPG-Eigenbau MVP.
// Scrapt Al Jadeed + SAT-7 Arabic, mappt auf UNSERE tvg-ids und schreibt epg-lb.xml.
// Aufruf: node epg-generate.js [--days N] [--out path]
// Exit 1 bei leerem/zu kleinem Ergebnis (Bot-Alarm via Workflow-Fail).
// Nur Node-Builtins (keine npm-Abhängigkeiten).

const DAYS = parseInt((process.argv.find(a => a.startsWith('--days=')) || '--days=3').split('=')[1], 10) || 3;
const OUT = (process.argv.find(a => a.startsWith('--out=')) || '').split('=').slice(1).join('=') || 'epg-lb.xml';

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; PhoeniciaTV-EPG/1.0)' };
const SAT7_GUID = '57346bcc-8f75-4e0a-9fbc-25680eeec578';
const SAT7_PATH = '/Views/TvPrograms/_TvScheduleResult.cshtml';

// Unsere Kanal-IDs (normalisierte Form, wie die App nach @Suffix-Strip sucht)
const CH_JADEED = 'AlJadeed.lb';
const CH_SAT7 = 'SAT7Arabic.us';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeEntities(s) {
  return String(s).replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
                  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
                  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

// Offset von Asia/Beirut in Minuten für einen Zeitpunkt (DST-sicher via Intl)
function beirutOffsetMinutes(date) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Beirut', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(dtf.formatToParts(date).map(x => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour % 24), +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

// Baut "YYYYMMDDHHMMSS +0300" aus Beirut-Wandzeit (Y,M,D,hh,mm)
function xmltvTime(y, mo, d, hh, mm) {
  const guess = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
  const off = beirutOffsetMinutes(guess);
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  const pad = n => String(n).padStart(2, '0');
  return `${y}${pad(mo)}${pad(d)}${pad(hh)}${pad(mm)}00 ${sign}${pad(Math.floor(a / 60))}${pad(a % 60)}`;
}

async function fetchText(url, opts = {}) {
  const r = await fetch(url, { headers: UA, ...opts });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.text();
}

function dayParts(offsetDays) {
  const now = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-').map(Number);
  return { y: parts[0], mo: parts[1], d: parts[2] };
}

// --- Al Jadeed: https://www.aljadeed.tv/schedule-channels-date/1/Y/M/D/en ---
async function scrapeJadeed() {
  const out = [];
  for (let i = 0; i < DAYS; i++) {
    const { y, mo, d } = dayParts(i);
    const url = `https://www.aljadeed.tv/schedule-channels-date/1/${y}/${mo}/${d}/en`;
    const html = await fetchText(url);
    const re = /Duration:\s*(\d+)\s*minute[\s\S]{0,400}?(\d{2}):(\d{2})[\s\S]{0,800}?padding-b-xs-45 d-block">\s*([^<]+?)\s*</g;
    let m, n = 0;
    while ((m = re.exec(html)) !== null) {
      const mins = parseInt(m[1], 10);
      const hh = parseInt(m[2], 10), mm = parseInt(m[3], 10);
      const title = decodeEntities(m[4]).trim().replace(/\s+/g, ' ');
      if (!title || !(mins > 0)) continue;
      const start = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
      const stop = new Date(start.getTime() + mins * 60000);
      const f = d2 => ({ y: d2.getUTCFullYear(), mo: d2.getUTCMonth() + 1, d: d2.getUTCDate(), hh: d2.getUTCHours(), mm: d2.getUTCMinutes() });
      const s = f(start), e = f(stop);
      // NOTE: Zeiten der Quelle sind Beirut-Wandzeit; UTC-Rechnung dient nur Dauer-Addition
      out.push({ start: xmltvTime(s.y, s.mo, s.d, s.hh, s.mm), stop: xmltvTime(e.y, e.mo, e.d, e.hh, e.mm), title });
      n++;
    }
    console.log(`   Jadeed ${y}-${mo}-${d}: ${n} Sendungen`);
  }
  return out;
}

// --- SAT-7 Arabic: POST /General/GetData?guid=...&filterDate=YYYY-MM-DD ---
async function scrapeSat7() {
  const out = [];
  for (let i = 0; i < DAYS; i++) {
    const { y, mo, d } = dayParts(i);
    const ds = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const url = `https://www.sat7arabic.com/General/GetData?guid=${SAT7_GUID}&filterDate=${ds}&templatePath=${encodeURIComponent(SAT7_PATH)}`;
    const html = await fetchText(url, { method: 'POST' });
    const re = /sar-tv-programs-show-time">\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)[\s\S]{0,600}?sar-home-latest-programs-card-title">\s*([^<]+?)\s*</g;
    const to24 = (h, ap) => (h % 12) + (ap === 'PM' ? 12 : 0);
    let m, n = 0;
    while ((m = re.exec(html)) !== null) {
      const title = decodeEntities(m[7]).trim().replace(/\s+/g, ' ');
      if (!title) continue;
      const sh = to24(parseInt(m[1], 10), m[3]), sm = parseInt(m[2], 10);
      let eh = to24(parseInt(m[4], 10), m[6]); const em = parseInt(m[5], 10);
      let ed = d, em2 = mo, ey = y;
      if (eh * 60 + em <= sh * 60 + sm) { const nx = new Date(Date.UTC(y, mo - 1, d + 1)); ey = nx.getUTCFullYear(); em2 = nx.getUTCMonth() + 1; ed = nx.getUTCDate(); }
      out.push({ start: xmltvTime(y, mo, d, sh, sm), stop: xmltvTime(ey, em2, ed, eh, em), title });
      n++;
    }
    console.log(`   SAT-7 ${ds}: ${n} Sendungen`);
  }
  return out;
}

async function main() {
  console.log('📺 EPG-Eigenbau MVP: Al Jadeed + SAT-7 Arabic, Tage:', DAYS);
  const jadeed = await scrapeJadeed();
  const sat7 = await scrapeSat7();
  const channels = [
    { id: CH_JADEED, name: 'Al Jadeed', progs: jadeed },
    { id: CH_SAT7, name: 'SAT-7 Arabic', progs: sat7 },
  ];
  for (const c of channels) {
    if (c.progs.length < 3) throw new Error(`Zu wenig EPG-Daten für ${c.id}: ${c.progs.length}`);
  }
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="PhoeniciaTV-EPG">\n';
  for (const c of channels) {
    xml += `  <channel id="${c.id}"><display-name>${esc(c.name)}</display-name></channel>\n`;
  }
  let total = 0;
  const seen = new Set();
  for (const c of channels) {
    for (const p of c.progs) {
      const key = `${c.id}|${p.start}|${p.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      xml += `  <programme start="${p.start}" stop="${p.stop}" channel="${c.id}"><title>${esc(p.title)}</title></programme>\n`;
      total++;
    }
  }
  xml += '</tv>\n';
  if (total < 20) throw new Error(`Zu wenig Programme gesamt: ${total}`);
  if (Buffer.byteLength(xml, 'utf8') > 2 * 1024 * 1024) throw new Error('EPG zu groß (>2MB)');
  const fs = await import('node:fs');
  fs.writeFileSync(OUT, xml, 'utf-8');
  console.log(`✅ ${OUT}: ${total} Sendungen (${(Buffer.byteLength(xml, 'utf8') / 1024).toFixed(1)} KB)`);
}

main().catch(e => { console.error('❌ EPG:', e.message); process.exit(1); });

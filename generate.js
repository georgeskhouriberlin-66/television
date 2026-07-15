import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, 'iptv-config.yml');
const CACHE_DIR = path.join(__dirname, 'temp');
const BACKUP_DIR = path.join(__dirname, 'backups');

// --- Config (embedded from YAML) ---
const CONFIG = {
  github_user: 'georgeskhouriberlin-66',
  repo_name: 'television',
  sources: {
    lb: 'https://iptv-org.github.io/iptv/countries/lb.m3u',
    sy: 'https://iptv-org.github.io/iptv/countries/sy.m3u',
    eg: 'https://iptv-org.github.io/iptv/countries/eg.m3u',
    jo: 'https://iptv-org.github.io/iptv/countries/jo.m3u',
    ae: 'https://iptv-org.github.io/iptv/countries/ae.m3u',
    qa: 'https://iptv-org.github.io/iptv/countries/qa.m3u',
    us: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    ru: 'https://iptv-org.github.io/iptv/countries/ru.m3u',
    ua: 'https://iptv-org.github.io/iptv/countries/ua.m3u',
    de: 'https://iptv-org.github.io/iptv/countries/de.m3u',
    sa: 'https://iptv-org.github.io/iptv/countries/sa.m3u',
    iq: 'https://iptv-org.github.io/iptv/countries/iq.m3u',
    kw: 'https://iptv-org.github.io/iptv/countries/kw.m3u',
    ps: 'https://iptv-org.github.io/iptv/countries/ps.m3u',
    bh: 'https://iptv-org.github.io/iptv/countries/bh.m3u',
    ma: 'https://iptv-org.github.io/iptv/countries/ma.m3u',
    ly: 'https://iptv-org.github.io/iptv/countries/ly.m3u',
    om: 'https://iptv-org.github.io/iptv/countries/om.m3u',
    'free-tv': 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
  },
  playlists: {
    arabic: { output: 'arabic.m3u', combine: ['lb','sy','eg','jo','ae','qa','sa','iq','kw','ps','bh','ma','ly','om'], epg: ['EG','LB','SY','JO','AE','QA','SA','IQ','KW','PS','BH','MA','LY','OM'], style: 'Country â€“ Category' },
    gulf: { output: 'gulf.m3u', combine: ['ae','qa','jo'], epg: ['AE','QA','JO'], style: 'Country â€“ Category' },
    usa: { output: 'usa.m3u', combine: ['us'], epg: ['US'], style: 'USA â€“ Category' },
    eastblock: { output: 'eastblock.m3u', combine: ['ru','ua'], epg: ['RU','UA'], style: 'Country â€“ Category' },
    germany: { output: 'germany.m3u', combine: ['de'], epg: ['DE'], style: 'Germany â€“ Category' },
    libanon: { output: 'libanon.m3u', combine: ['lb'], epg: ['LB'], style: 'Lebanon – Category' },
    'free-world': { output: 'free-world.m3u', combine: ['free-tv'], epg: [], style: 'Free-TV' },
  },
};

const STATIC_CHANNELS = JSON.parse(fs.readFileSync(path.join(__dirname, 'channels.json'), 'utf-8'));

const COUNTRY_NAMES = { lb:'Lebanon', sy:'Syria', eg:'Egypt', jo:'Jordan', ae:'UAE', qa:'Qatar', sa:'Saudi Arabia', iq:'Iraq', kw:'Kuwait', ps:'Palestine', bh:'Bahrain', ma:'Morocco', ly:'Libya', om:'Oman', us:'USA', ru:'Russia', ua:'Ukraine', de:'Germany', 'free-tv':'Free-TV' };

const TINYURLS = {
  arabic:    'https://tinyurl.com/288e72mm',
  gulf:      'https://tinyurl.com/2y6788nu',
  usa:       'https://tinyurl.com/22xllnhv',
  eastblock: 'https://tinyurl.com/25lmqukn',
  germany:   'https://tinyurl.com/2bfom2bu',
  christian: 'https://tinyurl.com/25cwjmur',
  'free-world': null,
};

// --- M3U Parsing ---
function parseM3U(content, sourceKey) {
  const lines = content.split(/\r?\n/);
  const channels = [];
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('#EXTINF:')) {
      current = { raw: line, source: sourceKey, url: null };
      const tvgId = line.match(/tvg-id="([^"]*)"/i);
      const tvgName = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogo = line.match(/tvg-logo="([^"]*)"/i);
      const group = line.match(/group-title="([^"]*)"/i);
      const nameMatch = line.match(/,#EXTINF:[^,]*,(.+)/) || line.match(/,(.+)$/);
      current.tvgId = tvgId ? tvgId[1] : '';
      current.tvgName = tvgName ? tvgName[1] : '';
      current.tvgLogo = tvgLogo ? tvgLogo[1] : '';
      current.group = group ? group[1] : (COUNTRY_NAMES[sourceKey] || sourceKey);
      current.name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    } else if (line && /^[a-z]+:\/\//.test(line) && current) {
      current.url = line;
      channels.push({ ...current });
      current = null;
    } else if (line.startsWith('#EXTVLCOPT') || line.startsWith('#EXTM3U')) {
      // skip headers/options
    }
  }
  return channels;
}

function formatM3U(channels, epgCountries, style) {
  const epgUrls = epgCountries.map(c => `https://epg.pw/xmltv/epg_${c}.xml.gz`);
  let output = '#EXTM3U';
  if (epgUrls.length > 0) {
    output += ' url-tvg="' + epgUrls.join('" url-tvg="') + '"';
  }
  output += '\n';

  for (const ch of channels) {
    const groupTitle = style.replace('Country', COUNTRY_NAMES[ch.source] || ch.source).replace('Category', ch.group || 'General');
    let extinf = `#EXTINF:-1`;
    if (ch.tvgId) extinf += ` tvg-id="${ch.tvgId}"`;
    if (ch.tvgName) extinf += ` tvg-name="${ch.tvgName}"`;
    if (ch.tvgLogo) extinf += ` tvg-logo="${ch.tvgLogo}"`;
    extinf += ` group-title="${groupTitle}"`;
    extinf += `,${ch.name}`;
    output += extinf + '\n' + ch.url + '\n';
  }
  return output;
}

function formatStaticM3U(channels) {
  let output = '#EXTM3U\n';
  for (const ch of channels) {
    let extinf = '#EXTINF:-1';
    if (ch.tvgId) extinf += ` tvg-id="${ch.tvgId}"`;
    if (ch.tvgName) extinf += ` tvg-name="${ch.tvgName}"`;
    if (ch.tvgLogo) extinf += ` tvg-logo="${ch.tvgLogo}"`;
    extinf += ` group-title="${ch.group || 'Christian'}"`;
    extinf += `,${ch.name}`;
    output += extinf + '\n' + ch.url + '\n';
  }
  return output;
}

function allOutputs() {
  const out = [];
  for (const key of Object.keys(CONFIG.playlists)) {
    out.push({ key, output: CONFIG.playlists[key].output });
  }
  for (const key of Object.keys(STATIC_CHANNELS)) {
    out.push({ key, output: STATIC_CHANNELS[key].output });
  }
  return out;
}

// --- Download ---
async function download(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.text();
}

// --- Validation ---
function validateM3U(content, name) {
  const issues = [];
  if (!content.startsWith('#EXTM3U')) issues.push('Missing #EXTM3U header');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const urls = lines.filter(l => /^[a-z]+:\/\//.test(l));
  if (urls.length === 0) issues.push('No channel URLs found');
  const extinfCount = lines.filter(l => l.startsWith('#EXTINF:') && !l.includes('x-tvg-url=')).length;
  if (extinfCount === 0) issues.push('No #EXTINF entries found');
  if (extinfCount !== urls.length) issues.push(`Mismatch: ${extinfCount} EXTINF vs ${urls.length} URLs`);
  return { valid: issues.length === 0, issues, channelCount: urls.length };
}

// --- Tidy ---
function tidyOldBackups(maxAgeDays = 7) {
  if (!fs.existsSync(BACKUP_DIR)) return 0;
  const now = Date.now();
  let removed = 0;
  for (const entry of fs.readdirSync(BACKUP_DIR)) {
    const p = path.join(BACKUP_DIR, entry);
    if (!fs.statSync(p).isDirectory()) continue;
    const ageDays = (now - fs.statSync(p).mtimeMs) / 86400000;
    if (ageDays > maxAgeDays) {
      fs.rmSync(p, { recursive: true, force: true });
      removed++;
    }
  }
  return removed;
}

// --- Backup ---
function backup(outputDir) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const bDir = path.join(BACKUP_DIR, ts);
  fs.mkdirSync(bDir, { recursive: true });
  for (const { output } of allOutputs()) {
    const src = path.join(outputDir, output);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(bDir, output));
    }
  }
  return bDir;
}

function restoreBackup(bDir, outputDir) {
  for (const { output } of allOutputs()) {
    const src = path.join(bDir, output);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(outputDir, output));
    }
  }
}

// --- Dedup ---
function removeDuplicates(channels) {
  const seen = new Set();
  return channels.filter(ch => {
    const key = `${ch.url}|${ch.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Sort ---
function sortChannels(channels) {
  return channels.sort((a, b) => {
    const g = (a.group || '').localeCompare(b.group || '');
    if (g !== 0) return g;
    return (a.name || '').localeCompare(b.name || '');
  });
}

function embedTinyURLs() {
  const block = '\n' + Object.entries(TINYURLS).map(([k, v]) => `#TINYURL:${k}:${v}`).join('\n') + '\n';
  for (const { output } of allOutputs()) {
    fs.appendFileSync(path.join(__dirname, output), block, 'utf-8');
  }
}

// --- URL Validation ---
const VALIDATION_TIMEOUT = 3000;
const VALIDATION_CONCURRENCY = 30;

async function checkURL(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT);
    const resp = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    return resp.ok || resp.status === 403 || resp.status === 429;
  } catch {
    return false;
  }
}

async function removeDeadChannels(channels, label) {
  const alive = [];
  for (let i = 0; i < channels.length; i += VALIDATION_CONCURRENCY) {
    const batch = channels.slice(i, i + VALIDATION_CONCURRENCY);
    const results = await Promise.all(batch.map(ch => checkURL(ch.url)));
    for (let j = 0; j < batch.length; j++) {
      if (results[j]) alive.push(batch[j]);
    }
    const done = Math.min(i + VALIDATION_CONCURRENCY, channels.length);
    process.stdout.write(`\r   ${label}: testing ${done}/${channels.length}...`);
  }
  process.stdout.write('\n');
  return alive;
}

// --- Main ---
async function main() {
  const onlyValidate = process.argv.includes('--validate-only');
  const outputDir = __dirname;

  console.log('ðŸ“¡ IPTV Playlist Generator\n');

  // 1. Download all sources
  console.log('â¬‡ï¸  Downloading sources...');
  const rawData = {};
  for (const [key, url] of Object.entries(CONFIG.sources)) {
    try {
      console.log(`   ${key} â†’ ${url}`);
      rawData[key] = await download(url);
    } catch (e) {
      console.error(`   âŒ ${key}: ${e.message}`);
      if (!onlyValidate) process.exit(1);
    }
  }

  if (onlyValidate) {
    console.log('\nðŸ” Validation mode: checking existing playlists...');
    let allOk = true;
    for (const key of Object.keys(CONFIG.playlists)) {
      const p = CONFIG.playlists[key];
      const f = path.join(outputDir, p.output);
      if (!fs.existsSync(f)) {
        console.log(`   âŒ ${p.output}: file not found`);
        allOk = false;
        continue;
      }
      const content = fs.readFileSync(f, 'utf-8');
      const result = validateM3U(content, p.output);
      if (result.valid) {
        console.log(`   âœ… ${p.output}: ${result.channelCount} channels`);
      } else {
        console.log(`   âŒ ${p.output}: ${result.issues.join(', ')}`);
        allOk = false;
      }
    }
    process.exit(allOk ? 0 : 1);
  }

  // 2. Backup existing
  console.log('\nðŸ’¾ Creating backup...');
  const backupDir = backup(outputDir);
  console.log(`   â†’ ${backupDir}`);

  // 3. Parse sources
  console.log('\nðŸ”§ Parsing channels...');
  const parsed = {};
  for (const key of Object.keys(CONFIG.sources)) {
    if (rawData[key]) {
      parsed[key] = parseM3U(rawData[key], key);
      console.log(`   ${key}: ${parsed[key].length} channels`);
    }
  }

  // 4. Build playlists
  console.log('\nðŸ“¦ Building playlists...');
  let allValid = true;
  const results = [];

  for (const [key, cfg] of Object.entries(CONFIG.playlists)) {
    console.log(`   ${cfg.output}:`);
    let channels = [];
    for (const src of cfg.combine) {
      if (parsed[src]) {
        channels = channels.concat(parsed[src]);
        console.log(`     + ${src} (${parsed[src].length})`);
      }
    }

    // Apply rules
    const before = channels.length;
    channels = removeDuplicates(channels);
    const afterDedup = channels.length;
    channels = sortChannels(channels);

    console.log(`     = ${before} raw → ${afterDedup} unique → ${channels.length} sorted`);

    // Validate URLs (opt-in via --validate for CI/CD)
    const doValidate = process.argv.includes('--validate');
    if (doValidate && channels.length > 0) {
      const beforeVal = channels.length;
      channels = await removeDeadChannels(channels, cfg.output);
      console.log(`     → ${channels.length}/${beforeVal} alive after validation`);
    }

    // Format
    const m3u = formatM3U(channels, cfg.epg, cfg.style);
    fs.writeFileSync(path.join(outputDir, cfg.output), m3u, 'utf-8');

    // Validate
    const result = validateM3U(m3u, cfg.output);
    if (result.valid) {
      console.log(`     âœ… ${result.channelCount} channels, valid`);
    } else {
      console.log(`     âŒ ${result.issues.join(', ')}`);
      allValid = false;
    }
    results.push({ key, file: cfg.output, valid: result.valid, channels: result.channelCount });
  }

  // 4b. Build static playlists
  console.log('\n📻 Building static playlists...');
  for (const [key, cfg] of Object.entries(STATIC_CHANNELS)) {
    console.log(`   ${cfg.output}:`);
    const m3u = formatStaticM3U(cfg.channels);
    fs.writeFileSync(path.join(outputDir, cfg.output), m3u, 'utf-8');
    const result = validateM3U(m3u, cfg.output);
    if (result.valid) {
      console.log(`     ✅ ${result.channelCount} channels, valid`);
    } else {
      console.log(`     ❌ ${result.issues.join(', ')}`);
    }
    results.push({ key, file: cfg.output, valid: result.valid, channels: result.channelCount });
  }

  // 5. Rollback if invalid
  if (!allValid) {
    console.log('\nâš ï¸  Validation errors detected!');
    if (process.env.ENABLE_ROLLBACK !== 'false') {
      console.log('â†©ï¸  Rolling back to backup...');
      restoreBackup(backupDir, outputDir);
      console.log('   âœ… Restored from backup');
    } else {
      console.log('   âš ï¸ Rollback disabled, keeping generated files');
    }
  } else {
    // Remove backup if all valid
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
      console.log('\nðŸ§¹ Backup cleaned (all valid)');
    }
  }

  // Tidy old backups
  const tidied = tidyOldBackups();
  if (tidied > 0) console.log(`\nðŸ§¹ Removed ${tidied} old backup(s)`);

  // Summary
  console.log('\nðŸ“Š Summary:');
  for (const r of results) {
    console.log(`   ${r.valid ? 'âœ…' : 'âŒ'} ${r.file}: ${r.channels} channels`);
  }

  // Embed TinyURLs
  embedTinyURLs();
  console.log('\nðŸ”— TinyURLs:');
  for (const [key, url] of Object.entries(TINYURLS)) {
    console.log(`   ${key}: ${url}`);
  }

  if (allValid) {
    console.log('\nâœ… All playlists generated successfully!');
  } else {
    console.log('\nâŒ Some playlists have issues (rolled back)');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});

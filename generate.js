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
  },
  playlists: {
    arabic: { output: 'arabic.m3u', combine: ['lb','sy','eg','jo','ae','qa'], epg: ['EG','LB','SY','JO','AE','QA'], style: 'Country – Category' },
    gulf: { output: 'gulf.m3u', combine: ['ae','qa','jo'], epg: ['AE','QA','JO'], style: 'Country – Category' },
    usa: { output: 'usa.m3u', combine: ['us'], epg: ['US'], style: 'USA – Category' },
    eastblock: { output: 'eastblock.m3u', combine: ['ru','ua'], epg: ['RU','UA'], style: 'Country – Category' },
    germany: { output: 'germany.m3u', combine: ['de'], epg: ['DE'], style: 'Germany – Category' },
  },
};

const COUNTRY_NAMES = { lb:'Lebanon', sy:'Syria', eg:'Egypt', jo:'Jordan', ae:'UAE', qa:'Qatar', us:'USA', ru:'Russia', ua:'Ukraine', de:'Germany' };

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
    } else if (line && !line.startsWith('#') && current) {
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
  const urls = lines.filter(l => l.startsWith('http://') || l.startsWith('https://'));
  if (urls.length === 0) issues.push('No channel URLs found');
  const extinfCount = lines.filter(l => l.startsWith('#EXTINF:') && !l.includes('x-tvg-url=')).length;
  if (extinfCount === 0) issues.push('No #EXTINF entries found');
  if (extinfCount !== urls.length) issues.push(`Mismatch: ${extinfCount} EXTINF vs ${urls.length} URLs`);
  return { valid: issues.length === 0, issues, channelCount: urls.length };
}

// --- Backup ---
function backup(outputDir) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const bDir = path.join(BACKUP_DIR, ts);
  fs.mkdirSync(bDir, { recursive: true });
  for (const key of Object.keys(CONFIG.playlists)) {
    const p = CONFIG.playlists[key];
    const src = path.join(outputDir, p.output);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(bDir, p.output));
    }
  }
  return bDir;
}

function restoreBackup(bDir, outputDir) {
  for (const key of Object.keys(CONFIG.playlists)) {
    const p = CONFIG.playlists[key];
    const src = path.join(bDir, p.output);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(outputDir, p.output));
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

// --- Main ---
async function main() {
  const onlyValidate = process.argv.includes('--validate-only');
  const outputDir = __dirname;

  console.log('📡 IPTV Playlist Generator\n');

  // 1. Download all sources
  console.log('⬇️  Downloading sources...');
  const rawData = {};
  for (const [key, url] of Object.entries(CONFIG.sources)) {
    try {
      console.log(`   ${key} → ${url}`);
      rawData[key] = await download(url);
    } catch (e) {
      console.error(`   ❌ ${key}: ${e.message}`);
      if (!onlyValidate) process.exit(1);
    }
  }

  if (onlyValidate) {
    console.log('\n🔍 Validation mode: checking existing playlists...');
    let allOk = true;
    for (const key of Object.keys(CONFIG.playlists)) {
      const p = CONFIG.playlists[key];
      const f = path.join(outputDir, p.output);
      if (!fs.existsSync(f)) {
        console.log(`   ❌ ${p.output}: file not found`);
        allOk = false;
        continue;
      }
      const content = fs.readFileSync(f, 'utf-8');
      const result = validateM3U(content, p.output);
      if (result.valid) {
        console.log(`   ✅ ${p.output}: ${result.channelCount} channels`);
      } else {
        console.log(`   ❌ ${p.output}: ${result.issues.join(', ')}`);
        allOk = false;
      }
    }
    process.exit(allOk ? 0 : 1);
  }

  // 2. Backup existing
  console.log('\n💾 Creating backup...');
  const backupDir = backup(outputDir);
  console.log(`   → ${backupDir}`);

  // 3. Parse sources
  console.log('\n🔧 Parsing channels...');
  const parsed = {};
  for (const key of Object.keys(CONFIG.sources)) {
    if (rawData[key]) {
      parsed[key] = parseM3U(rawData[key], key);
      console.log(`   ${key}: ${parsed[key].length} channels`);
    }
  }

  // 4. Build playlists
  console.log('\n📦 Building playlists...');
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

    // Format
    const m3u = formatM3U(channels, cfg.epg, cfg.style);
    fs.writeFileSync(path.join(outputDir, cfg.output), m3u, 'utf-8');

    // Validate
    const result = validateM3U(m3u, cfg.output);
    if (result.valid) {
      console.log(`     ✅ ${result.channelCount} channels, valid`);
    } else {
      console.log(`     ❌ ${result.issues.join(', ')}`);
      allValid = false;
    }
    results.push({ key, file: cfg.output, valid: result.valid, channels: result.channelCount });
  }

  // 5. Rollback if invalid
  if (!allValid) {
    console.log('\n⚠️  Validation errors detected!');
    if (process.env.ENABLE_ROLLBACK !== 'false') {
      console.log('↩️  Rolling back to backup...');
      restoreBackup(backupDir, outputDir);
      console.log('   ✅ Restored from backup');
    } else {
      console.log('   ⚠️ Rollback disabled, keeping generated files');
    }
  } else {
    // Remove backup if all valid
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
      console.log('\n🧹 Backup cleaned (all valid)');
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  for (const r of results) {
    console.log(`   ${r.valid ? '✅' : '❌'} ${r.file}: ${r.channels} channels`);
  }

  if (allValid) {
    console.log('\n✅ All playlists generated successfully!');
  } else {
    console.log('\n❌ Some playlists have issues (rolled back)');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});

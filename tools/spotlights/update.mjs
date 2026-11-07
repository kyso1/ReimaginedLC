// Tabela skin → vídeo do canal SkinSpotlights (YouTube), usada na aba "Vídeo" da prévia de skin.
//
// O canal não tem API própria e a API do YouTube pede chave: a lista de envios vem de uma instância do Invidious
// (front-end aberto do YouTube) e os nomes das skins, da Community Dragon (inglês, como os títulos do canal).
// Rodar de tempos em tempos: `node tools/spotlights/update.mjs` (grava src/data/skinSpotlights.json).
import fs from 'node:fs';

const CHANNEL = 'UC0NwzCHb8Fg89eTB5eYX17Q';
const INSTANCES = (process.env.INVIDIOUS ?? 'https://yt.chocolatemoo53.com,https://inv.nadeko.net,https://yewtu.be').split(',');
const SKINS = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json';
const OUT = new URL('../../src/data/skinSpotlights.json', import.meta.url);

const norm = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();

/** Nome da skin no título ("Star Guardian Ahri Skin Spotlight - Pre-Release - PBE Preview - League of Legends"); null fora do padrão. */
export function parseTitle(title) {
  const m = /^(.*?)\s+(?:League of Legends\s+)?Skin Spotlight\b(.*)$/i.exec(title);
  if (!m) return null;
  const pre = /pre-?release|pbe/i.test(m[2]) || /pre-?release/i.test(m[1]);
  const name = norm(m[1].replace(/\([^)]*\)/g, ' ').replace(/^full\s*-\s*/i, '').replace(/\s*\d{4}( update)?\s*$/i, ''));
  return name ? { name, pre } : null;
}

/** Vídeos (do mais novo ao mais velho) + skins → { skinId: videoId }. Vale o mais novo; o do PBE só sem o lançamento. */
export function match(videos, skins) {
  const byName = new Map();
  for (const v of videos) {
    const t = parseTitle(v.title);
    if (!t) continue;
    const cur = byName.get(t.name);
    if (!cur || (cur.pre && !t.pre)) byName.set(t.name, { id: v.id, pre: t.pre });
  }
  const out = {};
  for (const s of skins) {
    if (s.isBase) continue;
    const n = norm(s.name);
    const tries = [n, n.replace(/ nunu and willump$/, ' nunu'), n.replace(/ jarvan iv$/, ' jarvan'), n.replace(/ \d{4}$/, ''), n.replace(/ prestige edition$/, ' prestige'), n.replace(/^prestige (.*)$/, '$1 prestige edition')];
    const v = tries.map((x) => byName.get(x)).find(Boolean);
    if (v) out[s.id] = v.id;
  }
  return out;
}

async function uploads() {
  for (const host of INSTANCES) {
    const all = [];
    let cont = '';
    let complete = false;
    // Cada página tenta até 4 vezes (a instância falha de vez em quando); lista pela metade não serve.
    const page = async (url) => {
      for (let i = 0; i < 4; i++) {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
          if (r.ok) return await r.json();
        } catch {
          // tenta de novo
        }
        await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
      }
      return null;
    };
    for (let n = 0; n < 400; n++) {
      const j = await page(`${host}/api/v1/channels/${CHANNEL}/videos${cont ? `?continuation=${encodeURIComponent(cont)}` : ''}`);
      if (!j) break;
      for (const v of j.videos ?? []) all.push({ id: v.videoId, title: v.title });
      cont = j.continuation;
      if (!cont || !(j.videos ?? []).length) {
        complete = true;
        break;
      }
    }
    if (complete) return all;
    console.warn(`${host}: parou em ${all.length} vídeos, tentando a próxima instância`);
  }
  throw new Error('nenhuma instância do Invidious respondeu');
}

// Só roda quando chamado direto (o teste importa as funções).
if (process.argv[1]?.endsWith('update.mjs')) {
  const [videos, skins] = await Promise.all([uploads(), fetch(SKINS).then((r) => r.json())]);
  const table = match(videos, Object.values(skins));
  fs.writeFileSync(OUT, JSON.stringify(table) + '\n');
  console.log(`${videos.length} vídeos, ${Object.keys(table).length} skins com vídeo`);
}

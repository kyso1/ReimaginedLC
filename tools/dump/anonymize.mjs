const DROP_URI = /token|rso-auth|entitlements|lol-login|league-session/i;
const SECRET_KEY =
  /token|jwt|password|secret|authorization|cookie|credential|encryptionkey|spectatorkey|discord|lobbyname|groupname|^pty$|^auth$|apikey|signature|ticket|bearer/i;
const IDENTITY_KEY =
  /puuid|summonerid|accountid|gamename|summonername|displayname|internalname|^email$|^username$|^pid$|^jid$|partyid|multiuserchatid|channelclaim/i;
const TAG_KEY = /tagline|gametag/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const FAKE_PREFIX = '00000000-0000-4000-8000-';
const FAKE_UUID = /(00000000-0000-4000-8000-[0-9a-f]{12})/;
const SUBSTITUTE = /^(00000000-0000-4000-8000-[0-9a-f]{12}|anon-\d+)$/i;
const PVP = /([^\s@/"]+)@[^\s"/]*pvp\.net/gi;
const BARE_WORD = /^[\p{L}\p{N}_]+$/u;

const fakeUuid = (n) => FAKE_PREFIX + n.toString(16).padStart(12, '0');
const isIdentityValue = (v) =>
  (typeof v === 'string' && v.length >= 3) || (typeof v === 'number' && Number.isInteger(v) && v >= 100000);
const hasUuid = (s) => new RegExp(UUID.source, 'i').test(s);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Em objetos com puuid, `name` é o nome de invocador: vale como chave de identidade.
const keyOf = (obj, k) => (k === 'name' && 'puuid' in obj ? 'gameName' : k);

// Devolve o objeto/array se a string for JSON de objeto ou array; senão null.
function parseEmbedded(s) {
  if (!/^\s*[[{]/.test(s)) return null;
  try {
    const p = JSON.parse(s);
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}

// A primeira parte da URI (o nome do plugin, ex.: /lol-chat) nunca é identidade.
const splitUri = (uri) => {
  const m = /^(\/[^/?#]*)([\s\S]*)$/.exec(uri);
  return m ? [m[1], m[2]] : ['', uri];
};
// Caminho e pedaços da query (nomes e valores), cada um tratado isoladamente.
function uriParts(uri) {
  const rest = splitUri(uri)[1];
  const qi = rest.indexOf('?');
  const query = qi < 0 ? '' : rest.slice(qi);
  return { path: qi < 0 ? rest : rest.slice(0, qi), query, pieces: query.split(/([?&#=])/).filter((_, i) => i % 2 === 0) };
}

// Visita strings, chaves e números. JSON embutido em string é visitado por dentro, não pelo texto bruto.
function scan(value, key, visit) {
  if (typeof value === 'string') {
    const inner = parseEmbedded(value);
    if (inner) scan(inner, null, visit);
    else visit(value, key);
  } else if (Array.isArray(value)) for (const item of value) scan(item, key, visit);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      visit(k, null);
      scan(v, keyOf(value, k), visit);
    }
  } else visit(value, key);
}

export function collectIdentities(lines) {
  const map = new Map();
  let strings = 0;
  let numbers = 0;
  let uuids = 0;
  const addUuids = (s) => {
    for (const [m] of s.matchAll(UUID)) {
      const u = m.toLowerCase();
      if (!u.startsWith(FAKE_PREFIX) && !map.has(u)) map.set(u, fakeUuid(++uuids));
    }
  };
  const addText = (s) => {
    if (s.length >= 3 && !map.has(s)) map.set(s, `anon-${++strings}`);
  };
  const visit = (v, key) => {
    const identity = key !== null && IDENTITY_KEY.test(key);
    if (typeof v === 'string') {
      addUuids(v);
      if (!identity) return;
      // Com UUID dentro (ex.: "Nome <uuid>"), o resto sem os UUIDs e sem o @host também é identidade.
      if (hasUuid(v)) addText(v.replace(new RegExp(`${UUID.source}(@[^\\s"]*)?`, 'gi'), '').trim());
      else addText(v);
    } else if (identity && isIdentityValue(v) && !map.has(v)) map.set(v, 9000000 + ++numbers);
  };
  for (const line of lines) {
    if (line.uri) addUuids(line.uri);
    if (line.type !== 'meta') scan(line.data, null, visit);
  }
  return map;
}

// Valores sob chaves de segredo (qualquer profundidade, inclusive JSON embutido), para redigir onde mais aparecerem.
export function collectSecrets(lines) {
  const found = new Set();
  const walk = (v, inSecret) => {
    if (typeof v === 'string') {
      if (inSecret && v.length >= 4) found.add(v);
      const inner = parseEmbedded(v);
      if (inner) walk(inner, inSecret);
    } else if (typeof v === 'number') {
      if (inSecret && Number.isInteger(v) && String(v).length >= 4) found.add(String(v));
    } else if (Array.isArray(v)) for (const x of v) walk(x, inSecret);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, inSecret || SECRET_KEY.test(k));
  };
  for (const line of lines) if (line.type !== 'meta') walk(line.data, false);
  return found;
}

// Um valor a procurar. Casa o texto, a forma codificada para URL (%20 e +). Valores de 6+ caracteres
// casam em qualquer caixa e em qualquer lugar. Valores curtos casam só com a caixa exata e isolados
// por não-letra/dígito, para "lol" não destruir "/lol-lobby".
function entry(real, fake) {
  if (typeof real === 'number') return { real: String(real), fake: String(fake), text: false };
  const encoded = encodeURIComponent(real);
  const forms = [...new Set([encoded, encoded.replace(/%20/g, '+'), real])].map(esc).join('|');
  const short = real.length < 6;
  return {
    fake,
    text: true,
    short,
    re: new RegExp(short ? `(?<![\\p{L}\\p{N}])(?:${forms})(?![\\p{L}\\p{N}])` : forms, short ? 'gu' : 'giu'),
    whole: short ? new RegExp(`^(?:${forms})$`, 'u') : null,
  };
}

// Aplica o texto de `e` em partes fora dos UUIDs substitutos (nunca mexe dentro de um substituto).
const outside = (s, fn) => s.split(FAKE_UUID).map((p, i) => (i % 2 ? p : fn(p))).join('');

// mode: 'data' (valor em dados), 'path' (caminho de URI), 'whole' (pedaço de query).
// ctx: o valor está sob uma chave de identidade, onde foi coletado.
// Residual aceito: um nome curto igual a uma palavra solta em outro lugar (fase "Lobby", "None") continua
// visível lá; é vocabulário do protocolo, não revelação de identidade.
function applyEntry(s, e, mode, ctx) {
  if (!e.text) return outside(s, (p) => p.replaceAll(e.real, e.fake));
  if (!e.short) return outside(s, (p) => p.replace(e.re, () => e.fake));
  if (mode === 'path') return s;
  if (e.whole.test(s)) return mode === 'whole' || ctx ? e.fake : s;
  if (mode === 'whole' || BARE_WORD.test(s)) return s;
  return outside(s, (p) => p.replace(e.re, () => e.fake));
}

export function anonymize(lines) {
  const map = collectIdentities(lines);
  // Mais longos primeiro, para "FulanoSmurf" não virar "anon-1Smurf".
  const byLength = (list) => list.sort((x, y) => String(y[0]).length - String(x[0]).length).map(([real, fake]) => entry(real, fake));
  const idEntries = byLength([...map].filter(([real]) => !(typeof real === 'string' && hasUuid(real))));
  // Segredo que é só um UUID já tem substituto estável (mapUuids); redigi-lo quebraria ids como <uuid>@host.
  const bareUuid = (s) => new RegExp('^' + UUID.source + '$', 'i').test(s);
  const secretEntries = byLength([...collectSecrets(lines)].filter((s) => !bareUuid(s)).map((s) => [s, '[redacted]']));

  // ponytail: O(strings x identidades). Uma sessão tem milhares de strings e dezenas de identidades.
  // Se uma gravação ficar lenta para anonimizar, trocar por uma única regex com alternância.
  // Ordem dos passes: segredos, JWT, UUIDs, identidades, formas de tag.
  const redactSecrets = (s, mode, ctx) => secretEntries.reduce((out, e) => applyEntry(out, e, mode, ctx), s);
  const removeJwt = (s) => s.replace(JWT, '[jwt]');
  const mapUuids = (s) => s.replace(UUID, (m) => map.get(m.toLowerCase()) ?? m);
  const replaceIdentities = (s, mode, ctx) => idEntries.reduce((out, e) => applyEntry(out, e, mode, ctx), s);
  const blankTags = (s) => s.replace(/(anon-\d+(?:\s?#|%23))[^\s"#&%]{2,5}/g, '$1TAG');
  const cleanString = (s, mode = 'data', ctx = false) =>
    blankTags(replaceIdentities(mapUuids(removeJwt(redactSecrets(s, mode, ctx))), mode, ctx));

  const cleanUri = (uri) => {
    const [head] = splitUri(uri);
    const { path, query } = uriParts(uri);
    const tagged = query.replace(/([?&][^=&#]*)=([^&#]*)/g, (m, name) => (TAG_KEY.test(decodeURIComponent(name)) ? `${name}=TAG` : m));
    return head + cleanString(path, 'path') + tagged.split(/([?&#=])/).map((p, i) => (i % 2 ? p : cleanString(p, 'whole'))).join('');
  };

  const clean = (value, key) => {
    if (key !== null && SECRET_KEY.test(key)) return '[redacted]';
    if (key !== null && TAG_KEY.test(key)) return 'TAG';
    if (key === 'body' || key === 'note') return '[mensagem]';
    if (key === 'statusMessage') return '';
    if (typeof value === 'string') {
      const inner = parseEmbedded(value);
      return inner ? JSON.stringify(clean(inner, null)) : cleanString(value, 'data', key !== null && IDENTITY_KEY.test(key));
    }
    if (typeof value === 'number') return map.has(value) ? map.get(value) : value;
    if (Array.isArray(value)) return value.map((item) => clean(item, key));
    // Chaves de objeto também vazam (mapas indexados por PUUID ou ID), mas a decisão usa a chave original.
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [cleanString(k), clean(v, keyOf(value, k))]));
    return value;
  };

  return lines
    .filter((line) => !(line.uri && DROP_URI.test(line.uri)))
    .map((line) => {
      if (line.type === 'meta') return line;
      const out = { ...line, data: clean(line.data, null) };
      if (line.uri) out.uri = cleanUri(line.uri);
      return out;
    });
}

// Barreira final. As checagens por formato valem mesmo com `secrets` vazio; as demais usam a mesma
// regra de substituição de `anonymize`: se ela ainda trocaria algo, sobrou um valor real.
export function assertClean(lines, secrets) {
  const atoms = []; // todas as strings, para as checagens por formato
  const items = []; // o que será comparado com os valores coletados: { s, mode, ctx }
  const nums = [];
  for (const line of lines) {
    if (line.type === 'meta') continue;
    if (line.uri) {
      atoms.push(line.uri);
      const { path, pieces } = uriParts(line.uri);
      items.push({ s: path, mode: 'path', ctx: false });
      for (const p of pieces) items.push({ s: p, mode: 'whole', ctx: false });
    }
    scan(line.data, null, (v, key) => {
      if (typeof v === 'number') nums.push(String(v));
      else if (typeof v === 'string') {
        atoms.push(v);
        items.push({ s: v, mode: 'data', ctx: key !== null && IDENTITY_KEY.test(key) });
      }
    });
  }
  const bad = (what) => {
    throw new Error(`identidade real encontrada na saída anonimizada (${what})`);
  };
  if (atoms.some((a) => new RegExp(JWT.source).test(a))) throw new Error('JWT encontrado na saída anonimizada');
  for (const a of atoms) {
    for (const [m] of a.matchAll(UUID)) if (!m.toLowerCase().startsWith(FAKE_PREFIX)) bad('formato UUID');
    for (const m of a.matchAll(PVP)) if (!SUBSTITUTE.test(m[1])) bad('id de chat');
  }
  for (const s of secrets) {
    if (s === '' || s === undefined) continue;
    const e = entry(s, '\u0000');
    if (typeof s === 'number' && nums.includes(String(s))) bad('valor coletado');
    if (items.some((i) => applyEntry(i.s, e, i.mode, i.ctx) !== i.s)) bad('valor coletado');
  }
}

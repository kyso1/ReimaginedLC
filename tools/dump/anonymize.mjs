const DROP_URI = /token|rso-auth|entitlements|lol-login|league-session/i;
const SECRET_KEY =
  /token|jwt|password|secret|authorization|cookie|credential|encryptionkey|spectatorkey|discord|lobbyname|groupname|^pty$|^auth$|apikey|signature|ticket|bearer/i;
const IDENTITY_KEY =
  /puuid|summonerid|accountid|gamename|summonername|displayname|internalname|^email$|^username$|^pid$|^jid$|partyid|multiuserchatid|channelclaim/i;
const TAG_KEY = /tagline|gametag/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const FAKE_PREFIX = '00000000-0000-4000-8000-';
const SUBSTITUTE = /^(00000000-0000-4000-8000-[0-9a-f]{12}|anon-\d+)$/i;
const PVP = /([^\s@/"]+)@[^\s"/]*pvp\.net/gi;

const fakeUuid = (n) => FAKE_PREFIX + n.toString(16).padStart(12, '0');
const isIdentityValue = (v) =>
  (typeof v === 'string' && v.length >= 3) || (typeof v === 'number' && Number.isInteger(v) && v >= 100000);
const hasUuid = (s) => new RegExp(UUID.source, 'i').test(s);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Casa o texto real, a forma codificada para URL e qualquer caixa. Nomes curtos só valem isolados,
// senão "lol" destruiria "/lol-lobby" e "Verified" viraria lixo.
function pattern(real) {
  const forms = [...new Set([encodeURIComponent(real), real])].map(esc).join('|');
  const wrapped = real.length < 6 ? `(?<![\\p{L}\\p{N}])(?:${forms})(?![\\p{L}\\p{N}])` : forms;
  return new RegExp(wrapped, 'giu');
}

// A primeira parte da URI (o nome do plugin, ex.: /lol-chat) nunca é identidade.
const splitUri = (uri) => {
  const m = /^(\/[^/?#]*)([\s\S]*)$/.exec(uri);
  return m ? [m[1], m[2]] : ['', uri];
};

function scan(value, key, visit) {
  if (typeof value === 'string') {
    visit(value, key);
    if (/^\s*[[{]/.test(value)) {
      try {
        scan(JSON.parse(value), null, visit);
      } catch {}
    }
  } else if (Array.isArray(value)) for (const item of value) scan(item, key, visit);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      visit(k, null);
      scan(v, k, visit);
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
  const visit = (v, key) => {
    if (typeof v === 'string') {
      addUuids(v);
      if (key !== null && IDENTITY_KEY.test(key) && isIdentityValue(v) && !hasUuid(v) && !map.has(v)) map.set(v, `anon-${++strings}`);
    } else if (key !== null && IDENTITY_KEY.test(key) && isIdentityValue(v) && !map.has(v)) map.set(v, 9000000 + ++numbers);
  };
  for (const line of lines) {
    if (line.uri) addUuids(line.uri);
    if (line.type !== 'meta') scan(line.data, null, visit);
  }
  return map;
}

// Valores de strings sob chaves de segredo (qualquer profundidade), para redigir onde mais aparecerem.
export function collectSecrets(lines) {
  const found = new Set();
  const walk = (v, inSecret) => {
    if (typeof v === 'string') {
      if (inSecret && v.length >= 4) found.add(v);
    } else if (Array.isArray(v)) for (const x of v) walk(x, inSecret);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, inSecret || SECRET_KEY.test(k));
  };
  for (const line of lines) if (line.type !== 'meta') walk(line.data, false);
  return found;
}

export function anonymize(lines) {
  const map = collectIdentities(lines);
  const secrets = collectSecrets(lines);
  const entries = [
    ...[...map].filter(([real]) => !(typeof real === 'string' && hasUuid(real))).map(([real, fake]) => [String(real), String(fake), typeof real === 'string']),
    ...[...secrets].map((s) => [s, '[redacted]', true]),
  ]
    // Mais longos primeiro, para "FulanoSmurf" não virar "anon-1Smurf".
    .sort((a, b) => b[0].length - a[0].length)
    .map(([real, fake, isText]) => ({ real, fake, re: isText ? pattern(real) : null }));

  // ponytail: O(strings x identidades). Uma sessão tem milhares de strings e dezenas de identidades.
  // Se uma gravação ficar lenta para anonimizar, trocar por uma única regex com alternância.
  const cleanString = (s) => {
    let out = s.replace(JWT, '[jwt]').replace(UUID, (m) => map.get(m.toLowerCase()) ?? m);
    for (const { real, fake, re } of entries) out = re ? out.replace(re, () => fake) : out.replaceAll(real, fake);
    return out.replace(/(anon-\d+)#[^\s"#]{2,5}/g, '$1#TAG');
  };
  const cleanUri = (uri) => {
    const [head, rest] = splitUri(uri);
    return head + cleanString(rest);
  };

  const clean = (value, key) => {
    if (key !== null && SECRET_KEY.test(key)) return '[redacted]';
    if (key !== null && TAG_KEY.test(key)) return 'TAG';
    if (key === 'body' || key === 'note') return '[mensagem]';
    if (key === 'statusMessage') return '';
    if (typeof value === 'string') return cleanString(value);
    if (typeof value === 'number') return map.has(value) ? map.get(value) : value;
    if (Array.isArray(value)) return value.map((item) => clean(item, key));
    // Chaves de objeto também vazam (mapas indexados por PUUID ou ID), mas a decisão usa a chave original.
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [cleanString(k), clean(v, k)]));
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

// Barreira final. As checagens por formato valem mesmo com `secrets` vazio.
export function assertClean(lines, secrets) {
  const atoms = []; // todas as strings: URIs, chaves e valores
  const checked = []; // o mesmo, mas a URI sem o primeiro trecho (nome do plugin)
  const nums = [];
  for (const line of lines) {
    if (line.type === 'meta') continue;
    if (line.uri) {
      atoms.push(line.uri);
      checked.push(splitUri(line.uri)[1]);
    }
    scan(line.data, null, (v) => {
      if (typeof v === 'number') nums.push(String(v));
      else if (typeof v === 'string') (atoms.push(v), checked.push(v));
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
    if (typeof s === 'number') {
      if (nums.includes(String(s)) || checked.some((a) => a.includes(String(s)))) bad('valor coletado');
    } else if (s.length > 0) {
      const re = pattern(s);
      if (checked.some((a) => ((re.lastIndex = 0), re.test(a)))) bad('valor coletado');
    }
  }
}

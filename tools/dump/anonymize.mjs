const DROP_URI = /token|rso-auth|entitlements|lol-login|league-session/i;
export const SECRET_KEY =
  /(?<!required)token|jwt|password|secret|authorization|cookie|credential|encryptionkey|spectatorkey|discord|lobbyname|groupname|^pty$|^auth$|apikey|signature|ticket|bearer/i;
const IDENTITY_KEY =
  /puuid|summonerid|accountid|game_?name|summoner_?name|displayname|internalname|^email$|^username$|^pid$|^jid$|partyid|multiuserchatid|channelclaim|gameid$|matchid$|commonfriendname|playeralias|playerorteamname|nickname|^nick$/i;
const TAG_KEY = /tagline|gametag/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const FAKE_PREFIX = '00000000-0000-4000-8000-';
// Marcadores que o próprio anonimizador escreve: nenhuma substituição mexe dentro deles. "TAG" só é marcador
// onde o anonimizador o escreve (após um substituto, ou como valor inteiro); dentro de um nome real não é.
const PLACEHOLDER = /(00000000-0000-4000-8000-[0-9a-f]{12}|anon-\d+(?:\s?#|%23)TAG|anon-\d+|\[(?:redacted|mensagem|jwt)\]|^TAG$)/;
const SUBSTITUTE = /^(00000000-0000-4000-8000-[0-9a-f]{12}|anon-\d+)$/i;
const PVP = /([^\s@/"]+)@[^\s"/]*pvp\.net/gi;
const BARE_WORD = /^[\p{L}\p{N}_]+$/u;

const fakeUuid = (n) => FAKE_PREFIX + n.toString(16).padStart(12, '0');
const isIdentityValue = (v) =>
  (typeof v === 'string' && v.length >= 3) || (typeof v === 'number' && Number.isInteger(v) && v >= 100000);
const hasUuid = (s) => new RegExp(UUID.source, 'i').test(s);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Em objetos que já trazem uma identidade, `name` é o nome do jogador: vale como chave de identidade.
// `name` muda de sentido conforme os vizinhos: ao lado de uma identidade é nome de pessoa;
// numa página de runas (isDeletable + isEditable) é texto livre escrito pelo dono, tratado como `note`.
const keyOf = (obj, k) => {
  if (k !== 'name') return k;
  if (['puuid', 'pid', 'gameName', 'summonerId'].some((i) => i in obj)) return 'gameName';
  if ('isDeletable' in obj && 'isEditable' in obj) return 'note';
  return k;
};

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
  return { path: qi < 0 ? rest : rest.slice(0, qi), query, pieces: query.split(/([?&=])/).filter((_, i) => i % 2 === 0) };
}

// Visita strings, chaves e números. JSON embutido em string é visitado por dentro e também como texto bruto,
// marcado com `raw` (a coleta de identidades o ignora; a barreira confere o que de fato será gravado).
function scan(value, key, visit) {
  if (typeof value === 'string') {
    const inner = parseEmbedded(value);
    if (inner) {
      visit(value, key, true);
      scan(inner, null, visit);
    } else visit(value, key);
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
  const visit = (v, key, raw) => {
    if (raw) return;
    const identity = key !== null && IDENTITY_KEY.test(key);
    if (typeof v === 'string') {
      addUuids(v);
      if (!identity) return;
      // Com UUID dentro (ex.: "Nome <uuid>"), o resto sem os UUIDs e sem o @host também é identidade.
      if (hasUuid(v)) addText(v.replace(new RegExp(`${UUID.source}(@[^\\s"]*)?`, 'gi'), '').replace(/^[\s<>()[\]{}|,;:-]+|[\s<>()[\]{}|,;:-]+$/g, ''));
      else addText(v);
    } else if (identity && isIdentityValue(v) && !map.has(v)) map.set(v, 9000000 + ++numbers);
  };
  for (const line of lines) {
    if (line.uri) addUuids(line.uri);
    if (line.type !== 'meta') scan(line.data, null, visit);
  }
  return map;
}

// Um segredo "parece token" se tem 8+ caracteres com algum dígito, ou qualquer caractere fora de
// letras, dígitos, espaço, "_" e "-"; e não é só dígitos. Os demais (palavras, números, "EUW1") se comportam como valores curtos.
const tokenLike = (s) => !/^\d+$/.test(s) && ((s.length >= 8 && /\d/.test(s)) || /[^\p{L}\p{N}\s_-]/u.test(s));

// Valores sob chaves de segredo (qualquer profundidade, inclusive JSON embutido), para redigir onde mais aparecerem.
// Valor sob a própria chave de segredo é sempre coletado; valor só herdado de um ancestral (ex.: gameId dentro de
// playerCredentials) só se parecer token. A subárvore inteira continua sendo redigida onde está.
export function collectSecrets(lines) {
  const found = new Set();
  const walk = (v, inSecret, direct) => {
    if (typeof v === 'string') {
      if (inSecret && v.length >= 4 && (direct || tokenLike(v))) found.add(v);
      const inner = parseEmbedded(v);
      if (inner) walk(inner, inSecret, false);
    } else if (typeof v === 'number') {
      const t = String(v);
      if (inSecret && direct && Number.isInteger(v) && t.length >= 4) found.add(t);
    } else if (Array.isArray(v)) for (const x of v) walk(x, inSecret, direct);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, inSecret || SECRET_KEY.test(k), SECRET_KEY.test(k));
  };
  for (const line of lines) if (line.type !== 'meta') walk(line.data, false, false);
  return found;
}

// Um valor a procurar. Casa o texto e a forma codificada para URL (%20 e +). Valores de 6+ caracteres
// (e segredos que parecem token) casam em qualquer caixa e em qualquer lugar. Valores curtos, e segredos que são
// palavra ou número, casam só com a caixa exata, isolados por não-letra/dígito, para "lol" não destruir
// "/lol-lobby" nem a senha "friends" destruir "/lol-chat/v1/friends".
// Residual aceito: um segredo só de letras ou só de dígitos que também aparece num caminho de URI, ou como
// string solta sob outra chave, continua visível lá.
function entry(real, fake, isSecret = false) {
  if (typeof real === 'number') return { real: String(real), fake: String(fake), text: false };
  const encoded = encodeURIComponent(real);
  const forms = [...new Set([encoded, encoded.replace(/%20/g, '+'), real])].map(esc).join('|');
  const short = real.length < 6 || (isSecret && !tokenLike(real));
  return {
    fake,
    text: true,
    short,
    re: new RegExp(short ? `(?<![\\p{L}\\p{N}])(?:${forms})(?![\\p{L}\\p{N}])` : forms, short ? 'gu' : 'giu'),
    whole: short ? new RegExp(`^(?:${forms})$`, 'u') : null,
    wholeTag: short ? new RegExp(`^(?:${forms})(?=(?:%23|#)[^\\s"#&%]{2,5}$)`, 'u') : null,
  };
}

// Aplica o texto de `e` em partes fora dos marcadores (nunca mexe dentro de um substituto).
const outside = (s, fn) => s.split(PLACEHOLDER).map((p, i) => (i % 2 ? p : fn(p))).join('');

// mode: 'data' (valor em dados), 'path' (caminho de URI), 'whole' (pedaço de query).
// ctx: o valor está sob uma chave de identidade, onde foi coletado.
// Residual aceito: um nome curto igual a uma palavra solta em outro lugar (fase "Lobby", "None") continua
// visível lá; é vocabulário do protocolo, não revelação de identidade.
function applyEntry(s, e, mode, ctx) {
  if (!e.text) return outside(s, (p) => p.replaceAll(e.real, e.fake));
  if (!e.short) return outside(s, (p) => p.replace(e.re, () => e.fake));
  if (mode === 'path') return s;
  if (e.whole.test(s)) return mode === 'whole' || ctx ? e.fake : s;
  // Valor de query seguido de tag (Nome%23tag ou Nome#tag): troca o nome, blankTags apaga a tag.
  if (mode === 'whole' && e.wholeTag.test(s)) return s.replace(e.wholeTag, e.fake);
  if (mode === 'whole' || BARE_WORD.test(s)) return s;
  return outside(s, (p) => p.replace(e.re, () => e.fake));
}

export function anonymize(lines) {
  // Sessão com segredos é só para depuração local; nunca vira fixture do repo.
  if (lines.some((l) => l.type === 'meta' && l.secrets)) throw new Error('sessão gravada com --keep-secrets tem segredos; grave de novo sem essa flag');
  const map = collectIdentities(lines);
  // Mais longos primeiro, para "FulanoSmurf" não virar "anon-1Smurf".
  const byLength = (list, isSecret) => list.sort((x, y) => String(y[0]).length - String(x[0]).length).map(([real, fake]) => entry(real, fake, isSecret));
  const idEntries = byLength([...map].filter(([real]) => !(typeof real === 'string' && hasUuid(real))), false);
  // Segredo que é só um UUID já tem substituto estável (mapUuids); redigi-lo quebraria ids como <uuid>@host.
  const bareUuid = (s) => new RegExp('^' + UUID.source + '$', 'i').test(s);
  const secretEntries = byLength([...collectSecrets(lines)].filter((s) => !bareUuid(s)).map((s) => [s, '[redacted]']), true);

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
    return head + cleanString(path, 'path') + tagged.split(/([?&=])/).map((p, i) => (i % 2 ? p : cleanString(p, 'whole'))).join('');
  };

  const clean = (value, key) => {
    if (key !== null && SECRET_KEY.test(key)) return '[redacted]';
    if (key !== null && TAG_KEY.test(key)) return 'TAG';
    if (key === 'body' || key === 'note') return '[mensagem]';
    if (key === 'statusMessage') return '';
    if (typeof value === 'string') {
      const ctx = key !== null && IDENTITY_KEY.test(key);
      const inner = parseEmbedded(value);
      if (inner) {
        const cleaned = JSON.stringify(clean(inner, null));
        // Só reserializa se algo mudou; senão mantém a string original byte a byte. O texto bruto também é
        // conferido: com chave duplicada, ele guarda valores que o objeto analisado já perdeu.
        return cleaned === JSON.stringify(inner) && cleanString(value, 'data', ctx) === value ? value : cleaned;
      }
      return cleanString(value, 'data', ctx);
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

// Segunda barreira, independente da regra de substituição: nenhum valor da lista de bloqueio (em qualquer caixa,
// também na forma decodificada de URL) pode aparecer na saída. A mensagem nunca traz o valor encontrado.
export function assertNotDenied(lines, denied) {
  const text = lines.map((l) => JSON.stringify(l)).join('\n').toLowerCase();
  // Decodifica cada trecho %XX isoladamente: um % solto não impede decodificar o resto.
  const decoded = text.replace(/(?:%[0-9a-f]{2})+/g, (m) => {
    try {
      return decodeURIComponent(m);
    } catch {
      return m;
    }
  }).toLowerCase();
  for (const d of denied) {
    const v = d.trim().toLowerCase();
    if (v && (text.includes(v) || decoded.includes(v))) throw new Error('valor da lista de bloqueio encontrado na saída anonimizada');
  }
}

// Barreira final. As checagens por formato valem mesmo com `identities` e `secrets` vazios; as demais usam a
// mesma regra de substituição de `anonymize`: se ela ainda trocaria algo, sobrou um valor real.
export function assertClean(lines, identities, secrets) {
  if (secrets === undefined) throw new TypeError('assertClean: `secrets` é obrigatório (passe [] se não houver)');
  // Materializa uma vez: o chamador pode passar iteradores de uso único.
  const wanted = [...[...identities].map((v) => [v, false]), ...[...secrets].map((v) => [v, true])];
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
    scan(line.data, null, (v, key, raw) => {
      if (typeof v === 'number') nums.push(String(v));
      else if (typeof v === 'string') {
        atoms.push(v);
        // JSON embutido canônico é coberto pela varredura do valor analisado; o texto bruto só é conferido
        // quando difere dela (ex.: chave duplicada guarda valores que o objeto analisado perdeu).
        if (raw && JSON.stringify(JSON.parse(v)) === v) return;
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
  for (const [s, isSecret] of wanted) {
    if (s === '' || s === undefined) continue;
    const e = entry(s, '\u0000', isSecret);
    if (typeof s === 'number' && nums.includes(String(s))) bad('valor coletado');
    if (items.some((i) => applyEntry(i.s, e, i.mode, i.ctx) !== i.s)) bad('valor coletado');
  }
}

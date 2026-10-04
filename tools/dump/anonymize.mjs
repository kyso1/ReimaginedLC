const DROP_URI = /token|rso-auth|entitlements|lol-login|league-session/i;
const SECRET_KEY = /token|jwt|password|secret|authorization|cookie|credential|encryptionkey|spectatorkey|discord|lobbyname|groupname|^pty$/i;
const IDENTITY_KEY = /puuid|summonerid|accountid|gamename|summonername|displayname|internalname|email|username|^pid$|^jid$|partyid|multiuserchatid|channelclaim/i;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;

const isIdentityValue = (v) =>
  (typeof v === 'string' && v.length >= 3) || (typeof v === 'number' && Number.isInteger(v) && v >= 100000);

function walk(value, key, visit) {
  visit(value, key);
  if (Array.isArray(value)) for (const item of value) walk(item, key, visit);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k, visit);
}

export function collectIdentities(lines) {
  const map = new Map();
  let strings = 0;
  let numbers = 0;
  for (const line of lines) {
    walk(line.data, null, (v, key) => {
      if (key === null || !IDENTITY_KEY.test(key) || !isIdentityValue(v) || map.has(v)) return;
      map.set(v, typeof v === 'string' ? `anon-${++strings}` : 9000000 + ++numbers);
    });
  }
  return map;
}

export function anonymize(lines) {
  const map = collectIdentities(lines);
  // Mais longos primeiro, para "FulanoSmurf" não virar "anon-1Smurf".
  const replacements = [...map].map(([real, fake]) => [String(real), String(fake)]).sort((a, b) => b[0].length - a[0].length);

  // ponytail: O(strings x identidades). Uma sessão tem milhares de strings e dezenas de identidades.
  // Se uma gravação ficar lenta para anonimizar, trocar por uma única regex com alternância.
  const cleanString = (s) => {
    let out = s.replace(JWT, '[jwt]');
    for (const [real, fake] of replacements) out = out.replaceAll(real, fake);
    return out;
  };

  const clean = (value, key) => {
    if (key !== null && SECRET_KEY.test(key)) return '[redacted]';
    if (key === 'tagLine' || key === 'gameTag') return 'TAG';
    if (key === 'body') return '[mensagem]';
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
    .map((line) => (line.uri ? { ...line, uri: cleanString(line.uri), data: clean(line.data, null) } : line));
}

export function assertClean(lines, secrets) {
  const text = JSON.stringify(lines);
  if (new RegExp(JWT.source).test(text)) throw new Error('JWT encontrado na saída anonimizada');
  for (const s of secrets) {
    if (text.includes(String(s))) throw new Error('identidade real encontrada na saída anonimizada');
  }
}

const CATEGORIES = {
  imagem: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'],
  video: ['webm', 'mp4'],
  audio: ['ogg', 'mp3', 'wav'],
  fonte: ['ttf', 'otf', 'woff', 'woff2'],
  codigo: ['js', 'css', 'html', 'hbs', 'map'],
  dados: ['json', 'txt', 'yaml', 'yml'],
};
const BY_EXT = Object.fromEntries(Object.entries(CATEGORIES).flatMap(([cat, exts]) => exts.map((e) => [e, cat])));

export const DECISION = {
  imagem: 'reutilizar por referência',
  video: 'reutilizar por referência',
  audio: 'reutilizar por referência',
  fonte: 'reutilizar por referência',
  codigo: 'ignorar',
  dados: 'ignorar (a LCU já entrega dados e textos localizados)',
  outro: 'ignorar',
};

export const category = (ext) => BY_EXT[ext] ?? 'outro';

export function parseAssetPath(line) {
  const parts = line.trim().split('/');
  if (parts[0] !== 'plugins' || parts.length < 5) return null;
  const rest = parts.slice(4).join('/');
  const dot = rest.lastIndexOf('.');
  return { plugin: parts[1], locale: parts[3], rest, ext: dot === -1 ? '' : rest.slice(dot + 1).toLowerCase() };
}

export function clientUrl({ plugin, rest }) {
  if (plugin === 'rcp-be-lol-game-data') return `/lol-game-data/assets/${rest}`;
  return null;
}

export function summarize(lines) {
  const out = {};
  for (const line of lines) {
    const p = parseAssetPath(line);
    if (!p) continue;
    const bucket = ((out[p.plugin] ??= {})[category(p.ext)] ??= { count: 0, localized: 0, samples: [] });
    if (p.locale !== 'default') {
      bucket.localized++;
      continue;
    }
    bucket.count++;
    const url = clientUrl(p);
    if (url && bucket.samples.length < 3) bucket.samples.push(url);
  }
  return out;
}

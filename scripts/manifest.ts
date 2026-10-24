// Gera manifest.json ({ version, files: { caminho: sha256 } }) e manifest.sig (ECDSA P-256 / SHA-256, formato
// IEEE P1363 em base64, o que o WebCrypto do carregador espera) na pasta do bundle.
// Uso: node scripts/manifest.ts <pasta> <versão> <chave-privada.pem>   (ou a chave PEM na variável RLC_SIGNING_KEY)
import { createHash, sign } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP = new Set(['manifest.json', 'manifest.sig']);

export function buildManifest(dir: string, version: string): { version: string; files: Record<string, string> } {
  const files: Record<string, string> = {};
  const paths = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).split(sep).join('/'))
    .filter((p) => !SKIP.has(p))
    .sort();
  for (const p of paths) files[p] = createHash('sha256').update(readFileSync(join(dir, p))).digest('hex');
  return { version, files };
}

/** Escreve os dois arquivos e devolve os bytes assinados. */
export function writeSigned(dir: string, version: string, privateKeyPem: string): Buffer {
  const raw = Buffer.from(JSON.stringify(buildManifest(dir, version), null, 2) + '\n');
  const sig = sign('sha256', raw, { key: privateKeyPem, dsaEncoding: 'ieee-p1363' });
  writeFileSync(join(dir, 'manifest.json'), raw);
  writeFileSync(join(dir, 'manifest.sig'), sig.toString('base64') + '\n');
  return raw;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [dir, version, keyFile] = process.argv.slice(2);
  const key = keyFile ? readFileSync(keyFile, 'utf8') : process.env.RLC_SIGNING_KEY;
  if (!dir || !version || !key) {
    console.error('uso: node scripts/manifest.ts <pasta> <versão> [chave.pem]  (ou RLC_SIGNING_KEY)');
    process.exit(1);
  }
  writeSigned(dir, version, key);
  console.log(`manifest assinado em ${dir}`);
}

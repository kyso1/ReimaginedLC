import { afterEach, expect, test, vi } from 'vitest';
import { sanitizeBg } from './background';
import { findHelper, HELPER_PORTS, resetHelper, sanitizeWallpapers, wallpaperUrl } from './wallpapers';

afterEach(() => resetHelper());

test('acha o auxiliar na porta que responde como ele; sem auxiliar, null', async () => {
  const base = `http://127.0.0.1:${HELPER_PORTS[1]}`;
  const token = 'a'.repeat(64);
  const f = vi.fn(async (url: string) => (url === `${base}/v1/status` ? new Response(JSON.stringify({ app: 'reimaginedlc-fundos' })) : url === `${base}/v1/token` ? new Response(JSON.stringify({ token })) : Promise.reject(new TypeError('recusado'))));
  expect(await findHelper(f as never)).toBe(base);
  // Arquivos levam o token da execução (o auxiliar recusa sem ele).
  expect(wallpaperUrl(base, 'e0123456789abcdef', 'thumb')).toBe(`${base}/v1/thumb/e0123456789abcdef?k=${token}`);
  resetHelper();
  // Outro programa na porta (responde, mas não é o auxiliar) não conta.
  expect(await findHelper((async () => new Response(JSON.stringify({ app: 'outro' }))) as never)).toBeNull();
});

test('lista do auxiliar: só entradas bem formadas, nunca caminho', () => {
  const list = sanitizeWallpapers([
    { id: 'e0123456789abcdef', source: 'engine', title: 'Chuva', media: 'video', mime: 'video/mp4', thumb: true },
    { id: '../../windows', source: 'user', title: 'x', media: 'image', mime: 'image/png' },
    { id: 'u0123456789abcdef', source: 'user', title: 'Praia', media: 'image', mime: 'text/html' },
  ]);
  expect(list.map((w) => w.title)).toEqual(['Chuva']);
});

test('fundo do auxiliar sobrevive no DataStore só com id e tipo válidos', () => {
  expect(sanitizeBg({ global: { kind: 'local', id: 'u0123456789abcdef', mime: 'video/webm' } }).global).toEqual({ kind: 'local', id: 'u0123456789abcdef', mime: 'video/webm' });
  expect(sanitizeBg({ global: { kind: 'local', id: 'C:/x.png', mime: 'image/png' } }).global).toEqual({ kind: 'none' });
});

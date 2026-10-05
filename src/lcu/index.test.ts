import { afterEach, expect, test, vi } from 'vitest';
import { createProfiles } from './index';

afterEach(() => vi.unstubAllGlobals());

test('perfil usa cache por puuid e codifica o puuid na URL', async () => {
  const f = vi.fn().mockResolvedValue(new Response('{"backgroundSkinId":1001}', { status: 200 }));
  const profile = createProfiles(f);
  expect(await profile('a/b c')).toEqual({ backgroundSkinId: 1001 });
  expect(await profile('a/b c')).toEqual({ backgroundSkinId: 1001 });
  expect(f).toHaveBeenCalledTimes(1);
  expect(f).toHaveBeenCalledWith('/lol-summoner/v1/summoner-profile?puuid=a%2Fb%20c');
});

test('perfil devolve null em 404, corpo inválido e falha de rede', async () => {
  const profile = createProfiles(vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(new Response('x', { status: 200 }))
    .mockRejectedValueOnce(new TypeError('rede')));
  expect(await profile('a')).toBeNull();
  expect(await profile('b')).toBeNull();
  expect(await profile('c')).toBeNull();
});

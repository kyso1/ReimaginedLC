import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { hidesLosses, opggRegion, resetOpgg, withLosses } from './opgg';

let urls: string[] = [];
beforeEach(() => {
  urls = [];
  resetOpgg();
  vi.stubGlobal('fetch', async (url: string) => {
    urls.push(url);
    const json = (v: unknown) => new Response(JSON.stringify(v));
    if (url.startsWith('/lol-summoner/v2/summoners/puuid/')) return json({ gameName: 'Zeca', tagLine: 'BR1' });
    if (url === '/riotclient/region-locale') return json({ region: 'BR' });
    if (url.includes('/v3/br/summoners?riot_id=')) return json({ data: [{ summoner_id: 'sid1', game_name: 'zeca', tagline: 'br1' }] });
    if (url.endsWith('/br/summoners/sid1/summary'))
      return json({ data: { summoner: { league_stats: [{ game_type: 'SOLORANKED', win: 50, lose: 40 }, { game_type: 'FLEXRANKED', win: null, lose: null }] } } });
    return new Response(null, { status: 404 });
  });
});
afterEach(() => vi.unstubAllGlobals());

test('região do client no formato do op.gg', () => {
  expect(opggRegion('BR')).toBe('br');
  expect(opggRegion('NA1')).toBe('na');
  expect(opggRegion('LA2')).toBe('las');
  expect(opggRegion('EUN1')).toBe('eune');
});

test('derrotas escondidas: só fila com elo, vitórias e zero derrotas', () => {
  expect(hidesLosses('RANKED_SOLO_5x5', { tier: 'GOLD', wins: 5, losses: 0 })).toBe(true);
  expect(hidesLosses('RANKED_SOLO_5x5', { tier: 'GOLD', wins: 5, losses: 3 })).toBe(false);
  expect(hidesLosses('RANKED_SOLO_5x5', { tier: '', wins: 0, losses: 0 })).toBe(false);
  expect(hidesLosses('JADE_RANKED_SOLO_5x5', { tier: 'GOLD', wins: 5, losses: 0 })).toBe(false);
});

test('preenche vitórias e derrotas do op.gg só onde a LCU escondeu', async () => {
  const map = { RANKED_SOLO_5x5: { tier: 'GOLD', wins: 52, losses: 0 }, RANKED_FLEX_SR: { tier: 'SILVER', wins: 3, losses: 0 } };
  const out = await withLosses('p1', map);
  expect(out!.RANKED_SOLO_5x5).toEqual({ tier: 'GOLD', wins: 50, losses: 40 });
  // O op.gg não tem Flex: fica como veio.
  expect(out!.RANKED_FLEX_SR).toEqual(map.RANKED_FLEX_SR);
  await withLosses('p1', map);
  expect(urls.filter((u) => u.includes('op.gg'))).toHaveLength(2);
});

test('com as derrotas (o próprio jogador, apex): não pergunta ao op.gg', async () => {
  const map = { RANKED_SOLO_5x5: { tier: 'GOLD', wins: 52, losses: 48 } };
  expect(await withLosses('p1', map)).toBe(map);
  expect(urls).toEqual([]);
});

test('op.gg sem o jogador: devolve como veio', async () => {
  vi.stubGlobal('fetch', async (url: string) =>
    url.includes('op.gg') ? new Response(JSON.stringify({ data: [] })) : new Response(JSON.stringify(url.includes('region') ? { region: 'BR' } : { gameName: 'Zeca', tagLine: 'BR1' })),
  );
  const map = { RANKED_SOLO_5x5: { tier: 'GOLD', wins: 52, losses: 0 } };
  expect(await withLosses('p2', map)).toBe(map);
});

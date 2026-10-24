import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { cell, session } from '../../test/fixtures';
import { clearRecentCache, matchNames, MUTES, PARTICIPANTS, recentOf, roomOf, summarize, useRealNames, type Participant } from './names';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const part = (puuid: string, name: string, cid = 'room1@champ-select.br1.pvp.net'): Participant => ({ cid, game_name: name, game_tag: 'BR1', puuid });

test('sala da seleção: só participantes da champ-select, da sala atual quando dá para saber, sem repetir', () => {
  const list = [part('a', 'Ana'), part('a', 'Ana'), part('b', 'Bia', 'old@champ-select.br1.pvp.net'), part('c', 'Caio', 'lobby@br1.pvp.net'), { cid: 'room1@champ-select.br1.pvp.net', puuid: 'd' }];
  expect(roomOf(list, 'room1').map((p) => p.puuid)).toEqual(['a']);
  expect(roomOf(list, 'room1@champ-select.br1.pvp.net').map((p) => p.puuid)).toEqual(['a']);
  // id da sala que não bate com nada: todas as salas de seleção
  expect(roomOf(list, 'outra').map((p) => p.puuid)).toEqual(['a', 'b']);
  expect(roomOf(list).map((p) => p.puuid)).toEqual(['a', 'b']);
});

test('casa por puuid, por puuid ofuscado e pela única sobra; com duas sobras não chuta', () => {
  const room = [part('p0', 'Eu'), part('p1', 'Ana'), part('p2', 'Bia'), part('p3', 'Caio')];
  const cells = [cell({ cellId: 0, puuid: 'p0' }), cell({ cellId: 1, puuid: '', obfuscatedPuuid: 'o1', nameVisibilityType: 'HIDDEN' }), cell({ cellId: 2, puuid: '', obfuscatedPuuid: 'o2' })];
  const m = matchNames(cells, room, new Map([['o1', 'p1']]));
  expect(m.get(0)).toEqual({ gameName: 'Eu', tagLine: 'BR1', puuid: 'p0' });
  expect(m.get(1)?.gameName).toBe('Ana');
  // sobram p2 e p3 para a vaga 2: não dá para saber
  expect(m.has(2)).toBe(false);
  expect(matchNames(cells, room.slice(0, 3), new Map([['o1', 'p1']])).get(2)?.gameName).toBe('Bia');
});

test('últimas partidas: KDA somado, rota mais jogada (bot suporte é suporte), partidas sem dados fora', () => {
  const g = (k: number, d: number, a: number, lane: string, role = 'SOLO') => ({ participants: [{ stats: { kills: k, deaths: d, assists: a }, timeline: { lane, role } }] });
  expect(summarize([g(5, 2, 5, 'BOTTOM', 'DUO_SUPPORT'), g(1, 3, 10, 'BOTTOM', 'DUO_SUPPORT'), g(10, 0, 0, 'MIDDLE'), {}])).toEqual({ kda: 31 / 5, lane: 'UTILITY', games: 3 });
  expect(summarize([g(3, 0, 1, 'NONE')])).toEqual({ kda: 4, lane: null, games: 1 });
  expect(summarize([])).toEqual({ kda: null, lane: null, games: 0 });
});

test('histórico com cache por puuid', async () => {
  clearRecentCache();
  const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ games: { games: [{ participants: [{ stats: { kills: 1, deaths: 1, assists: 1 }, timeline: { lane: 'TOP' } }] }] } }), { status: 200 }));
  vi.stubGlobal('fetch', f);
  expect(await recentOf('p 1')).toEqual({ kda: 2, lane: 'TOP', games: 1 });
  await recentOf('p 1');
  expect(f).toHaveBeenCalledTimes(1);
  expect(f).toHaveBeenCalledWith('/lol-match-history/v1/products/lol/p%201/matches?begIndex=0&endIndex=20');
});

function Probe({ s, out }: { s: ReturnType<typeof session>; out: (m: Map<number, unknown>) => void }) {
  out(useRealNames(s));
  return null;
}

test('tenta de novo enquanto a sala não tem todos e para quando casa todo mundo', async () => {
  vi.useFakeTimers();
  const rooms = [[part('p0', 'Eu')], [part('p0', 'Eu'), part('px', 'Ana')]];
  const f = vi.fn(async (url: string) => {
    if (url === PARTICIPANTS) return new Response(JSON.stringify({ participants: rooms.shift() ?? [] }), { status: 200 });
    if (url === MUTES) return new Response('{}', { status: 200 });
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal('fetch', f);
  let names = new Map<number, unknown>();
  const s = session({ myTeam: [cell({ cellId: 0, puuid: 'p0' }), cell({ cellId: 1, puuid: '', nameVisibilityType: 'HIDDEN' })] });
  const root = document.createElement('div');
  act(() => render(<Probe s={s} out={(m) => (names = m)} />, root));
  await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  expect(names.size).toBe(1);
  await act(async () => void (await vi.advanceTimersByTimeAsync(2000)));
  expect(names.size).toBe(2);
  const before = f.mock.calls.length;
  await act(async () => void (await vi.advanceTimersByTimeAsync(10000)));
  expect(f.mock.calls.length).toBe(before);
  render(null, root);
});

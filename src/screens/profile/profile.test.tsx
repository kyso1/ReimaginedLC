import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, queue, ready } from '../../test/fixtures';
import { relativeDay, teamGold } from './data';
import { Profile } from './Profile';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === text)!;
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

const part = (participantId: number, teamId: number, championId: number, stats: Record<string, unknown>) => ({ participantId, teamId, championId, stats });
const ident = (participantId: number, gameName: string, puuid: string) => ({ participantId, player: { gameName, puuid, summonerName: '' } });
const listGame = (gameId: number, win: boolean, queueId = 400) => ({
  gameId, queueId, gameDuration: 1721, gameCreation: Date.UTC(2026, 9, 5, 14, 0),
  participants: [part(1, 100, 103, { kills: 8, deaths: 2, assists: 11, win })],
  participantIdentities: [ident(1, 'Fulano', 'me')],
});
const fullGame = {
  ...listGame(1, true),
  participants: [part(1, 100, 103, { kills: 8, deaths: 2, assists: 11, win: true, totalDamageDealtToChampions: 31000, goldEarned: 12500, visionScore: 30, totalMinionsKilled: 190, neutralMinionsKilled: 24, damageDealtToObjectives: 5000, item0: 3089, item1: 0 }),
    part(6, 200, 238, { kills: 6, deaths: 5, assists: 2, win: false, totalDamageDealtToChampions: 24000, goldEarned: 11000, visionScore: 12, totalMinionsKilled: 170, neutralMinionsKilled: 0, damageDealtToObjectives: 2000 })],
  participantIdentities: [ident(1, 'Fulano', 'me'), ident(6, '<i>Zeca</i>', 'z')],
};
const timeline = { frames: [{ timestamp: 0, participantFrames: { '1': { participantId: 1, totalGold: 500 }, '6': { participantId: 6, totalGold: 500 } } }, { timestamp: 60000, participantFrames: { '1': { participantId: 1, totalGold: 900 }, '6': { participantId: 6, totalGold: 700 } } }] };
const ranked = { queueMap: { RANKED_SOLO_5x5: { tier: 'GOLD', division: 'II', leaguePoints: 48, wins: 54, losses: 46, previousSeasonEndTier: 'GOLD', previousSeasonEndDivision: 'IV' }, RANKED_FLEX_SR: { tier: 'SILVER', division: 'I', leaguePoints: 12, wins: 20, losses: 18 }, RANKED_TFT: { tier: '', division: 'NA', leaguePoints: 0, wins: 0, losses: 0 } } };
const mastery = [{ championId: 103, championLevel: 23, championPoints: 219000 }, { championId: 238, championLevel: 5, championPoints: 31000 }];

function routes(url: string): unknown {
  if (url === '/lol-summoner/v2/summoners/puuid/me') return { gameName: 'Fulano', tagLine: 'TAG', summonerLevel: 312, profileIconId: 29 };
  if (url.startsWith('/lol-match-history/v1/products/lol/me/matches')) {
    const beg = Number(/begIndex=(\d+)/.exec(url)![1]);
    return { games: { games: beg === 0 ? [listGame(1, true), listGame(2, false, 420)] : [listGame(3, true, 450)] } };
  }
  if (url === '/lol-match-history/v1/games/1') return fullGame;
  if (url === '/lol-match-history/v1/game-timelines/1') return timeline;
  if (url === '/lol-ranked/v1/ranked-stats/me') return ranked;
  if (url === '/lol-champion-mastery/v1/me/champion-mastery') return mastery;
  return null;
}

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn(async (url: string) => {
    const body = routes(url);
    return body === null ? new Response(null, { status: 404 }) : new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

function mount() {
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, champions: async () => new Map([[103, { id: 103, name: 'Ahri', icon: '/i/103.png', roles: [] }], [238, { id: 238, name: 'Zed', icon: '/i/238.png', roles: [] }]]) };
  lcu.queues.value = ready([queue({ id: 400, name: 'Normal (Escolha)' }), queue({ id: 420, name: 'Ranqueada Solo/Duo' }), queue({ id: 450, name: 'ARAM' })]) as Lcu['queues']['value'];
  act(() => render(<Profile lcu={lcu} puuid="me" />, root));
  return lcu;
}

test('vitrine: nome grande e uma linha com elo, nível e taxa de vitórias', async () => {
  mount();
  await settle();
  await settle();
  expect(root.querySelector('.rlc-pf-name')!.textContent).toBe('Fulano');
  expect(root.querySelector('.rlc-pf-line')!.textContent).toBe('Ouro II · nível 312 · 54% de vitórias');
});

test('histórico: linhas com campeão, resultado, KDA, fila e duração; filtro por fila; carregar mais', async () => {
  mount();
  await settle();
  act(() => tab('Histórico').click());
  await settle();
  await settle();
  const rows = () => [...root.querySelectorAll('.rlc-mh-row')];
  expect(rows().map((r) => r.getAttribute('data-win'))).toEqual(['true', 'false']);
  expect(rows()[0]!.textContent).toContain('Ahri · 8/2/11');
  expect(rows()[0]!.textContent).toContain('Normal (Escolha)');
  expect(rows()[0]!.textContent).toContain('28:41');
  act(() => btn('Ranqueada').click());
  expect(rows()).toHaveLength(1);
  act(() => btn('Todas').click());
  act(() => btn('Carregar mais').click());
  await settle();
  await settle();
  expect(rows()).toHaveLength(3);
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('begIndex=20&endIndex=40'))).toBe(true);
});

test('detalhe da partida: placar com os dois times, estatísticas e gráfico de ouro; voltar', async () => {
  mount();
  await settle();
  act(() => tab('Histórico').click());
  await settle();
  await settle();
  act(() => (root.querySelector('.rlc-mh-row') as HTMLButtonElement).click());
  await settle();
  await settle();
  const detail = root.querySelector('.rlc-md')!;
  expect(detail.querySelector('.rlc-md-result')!.textContent).toBe('Vitória');
  expect(detail.querySelectorAll('.rlc-md-team')).toHaveLength(2);
  expect(detail.textContent).toContain('<i>Zeca</i>');
  expect(detail.querySelector('i')).toBeNull();
  act(() => btn('Estatísticas').click());
  expect(detail.textContent).toContain('12.500');
  act(() => btn('Gráficos').click());
  await settle();
  expect(root.querySelectorAll('.rlc-md-chart polyline')).toHaveLength(2);
  act(() => btn('‹ Histórico').click());
  expect(root.querySelector('.rlc-md')).toBeNull();
  expect(root.querySelectorAll('.rlc-mh-row')).toHaveLength(2);
});

test('ranqueadas: três cartões iguais e temporada anterior; fila sem elo mostra "Sem classificação"', async () => {
  mount();
  await settle();
  act(() => tab('Ranqueadas').click());
  await settle();
  const cards = [...root.querySelectorAll('.rlc-rk-card')];
  expect(cards).toHaveLength(3);
  expect(cards[0]!.textContent).toContain('Ouro II');
  expect(cards[0]!.textContent).toContain('48 PdL');
  expect(cards[2]!.textContent).toContain('Sem classificação');
  expect(root.textContent).toContain('Ouro IV');
});

test('maestria: grade ordenada por pontos, ordenação por nome e busca', async () => {
  mount();
  await settle();
  act(() => tab('Maestria').click());
  await settle();
  await settle();
  const names = () => [...root.querySelectorAll('.rlc-ms-champ')].map((c) => c.getAttribute('aria-label'));
  expect(names()).toEqual(['Ahri', 'Zed']);
  act(() => btn('A–Z').click());
  expect(names()).toEqual(['Ahri', 'Zed']);
  const search = root.querySelector<HTMLInputElement>('.rlc-ms input')!;
  act(() => {
    search.value = 'ze';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(names()).toEqual(['Zed']);
});

test('dia relativo e ouro por time', () => {
  const now = Date.UTC(2026, 9, 5, 18);
  expect(relativeDay(Date.UTC(2026, 9, 5, 9), now)).toBe('hoje');
  expect(relativeDay(Date.UTC(2026, 9, 4, 9), now)).toBe('ontem');
  expect(teamGold(timeline as never, { 1: 100, 6: 200 })).toEqual({ blue: [500, 900], red: [500, 700], minutes: [0, 1] });
});

test('histórico: carregar mais fica desabilitado enquanto a página carrega', async () => {
  mount();
  await settle();
  act(() => tab('Histórico').click());
  await settle();
  await settle();
  act(() => btn('Carregar mais').click());
  expect(btn('Carregar mais').disabled).toBe(true);
  await settle();
  await settle();
});

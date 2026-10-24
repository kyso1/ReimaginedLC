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

const part = (participantId: number, teamId: number, championId: number, stats: Record<string, unknown>, lane = 'MIDDLE', role = 'SOLO') => ({ participantId, teamId, championId, spell1Id: 4, spell2Id: 14, stats, timeline: { lane, role } });
const ident = (participantId: number, gameName: string, puuid: string) => ({ participantId, player: { gameName, puuid, summonerName: '' } });
// "Agora" fixo nos testes: 5/out 18h UTC; partidas de hoje, de ontem e de 2/out.
const NOW = Date.UTC(2026, 9, 5, 18);
const DAYS: Record<number, number> = { 1: Date.UTC(2026, 9, 5, 14), 2: Date.UTC(2026, 9, 5, 12), 3: Date.UTC(2026, 9, 4, 14) };
const listGame = (gameId: number, win: boolean, queueId = 400, lane = 'MIDDLE', role = 'SOLO') => ({
  gameId, queueId, mapId: queueId === 450 ? 12 : 11, gameDuration: 1721, gameCreation: DAYS[gameId] ?? Date.UTC(2026, 9, 2, 14),
  participants: [part(1, 100, 103, { kills: 8, deaths: 2, assists: 11, win }, lane, role)],
  participantIdentities: [ident(1, 'Fulano', 'me')],
});
const fullGame = {
  ...listGame(1, true),
  gameDuration: 1800,
  participants: [part(1, 100, 103, { kills: 8, deaths: 2, assists: 11, win: true, totalDamageDealtToChampions: 31000, goldEarned: 12500, visionScore: 30, totalMinionsKilled: 190, neutralMinionsKilled: 24, damageDealtToObjectives: 5000, item0: 3089, item1: 0, item6: 3340, champLevel: 16, perk0: 8112, perkSubStyle: 8200 }),
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
    return { games: { games: beg === 0 ? [listGame(1, true), listGame(2, false, 420, 'BOTTOM', 'DUO_SUPPORT'), listGame(3, true, 440), listGame(4, false, 450)] : [listGame(5, true, 450)] } };
  }
  if (url === '/lol-match-history/v1/games/1') return fullGame;
  if (url === '/lol-match-history/v1/game-timelines/1') return timeline;
  if (url === '/lol-ranked/v1/ranked-stats/me') return ranked;
  if (url === '/lol-champion-mastery/v1/me/champion-mastery') return mastery;
  if (url === '/lol-game-data/assets/v1/perks.json') return [{ id: 8112, name: 'Eletrocutar', iconPath: '/r/8112.png' }];
  if (url === '/lol-game-data/assets/v1/perkstyles.json') return { styles: [{ id: 8200, name: 'Feitiçaria', iconPath: '/r/8200.png' }] };
  return null;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
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
  vi.useRealTimers();
});

function mount() {
  const lcu = fakeLcu();
  lcu.game = {
    ...lcu.game,
    champions: async () => new Map([[103, { id: 103, name: 'Ahri', icon: '/i/103.png', roles: [] }], [238, { id: 238, name: 'Zed', icon: '/i/238.png', roles: [] }]]),
    items: async () => new Map([[3089, '/it/3089.png'], [3340, '/it/3340.png']]),
    spells: async () => new Map([[4, { id: 4, name: 'Flash', icon: '/sp/4.png', gameModes: [] }], [14, { id: 14, name: 'Incendiar', icon: '/sp/14.png', gameModes: [] }]]),
  };
  lcu.queues.value = ready([queue({ id: 400, name: 'Normal (Escolha)' }), queue({ id: 420, name: 'Ranqueada Solo/Duo' }), queue({ id: 450, name: 'ARAM' })]) as Lcu['queues']['value'];
  act(() => render(<Profile lcu={lcu} puuid="me" />, root));
  return lcu;
}

test('vitrine: nome grande e uma linha com elo, nível e taxa de vitórias', async () => {
  mount();
  await settle();
  await settle();
  expect(root.querySelector('.rlc-pf-name')!.textContent).toBe('Fulano');
  // Elo no formato `{ícone} • {elo} {PDL}` e, ao lado, nível e taxa de vitórias.
  const rank = root.querySelector('.rlc-pf-line .rlc-rank')!;
  expect(rank.querySelector('img')!.getAttribute('src')).toContain('ranked-mini-crests/gold.svg');
  expect(rank.textContent).toBe('• Ouro II 48 PdL');
  expect(root.querySelector('.rlc-pf-line > span:last-child')!.textContent).toBe('nível 312 · 54% de vitórias');
  // Sem o estandarte pendurado (elo passado/evento): só o brasão; e nada do histórico até clicar na aba.
  expect(root.querySelector('.rlc-pf-banner')).toBeNull();
  expect(root.querySelector('.rlc-pf-crest .rlc-pf-icon')).not.toBeNull();
  expect(root.querySelector('.rlc-pf-sheet')).toBeNull();
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/matches'))).toBe(false);
});

const openHistory = async () => {
  act(() => tab('Histórico').click());
  await settle();
  await settle();
};
const esc = () => act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));

test('histórico: o quadro sobe com o feed por dia e a coluna de elo, rotas e KDA; a faixa de cima continua', async () => {
  mount();
  await settle();
  await openHistory();
  const sheet = root.querySelector('.rlc-pf-sheet')!;
  expect(sheet).not.toBeNull();
  expect(root.querySelector('.rlc-profile')!.getAttribute('data-sheet')).toBe('true');
  expect(root.querySelector('.rlc-pf-name')!.textContent).toBe('Fulano');
  // Dias: hoje (2 partidas), ontem (1), depois a data.
  const days = [...sheet.querySelectorAll('.rlc-pf-day')];
  expect(days.map((d) => d.querySelector('h3')!.textContent)).toEqual(['hoje', 'ontem', '02 de out.']);
  expect(days.map((d) => d.querySelectorAll('.rlc-mh-row').length)).toEqual([2, 1, 1]);
  const first = days[0]!.querySelector('.rlc-mh-row')!;
  expect(first.querySelector('img')!.getAttribute('alt')).toBe('Ahri');
  expect(first.querySelector('b')!.textContent).toBe('Vitória');
  expect(first.querySelector('.rlc-mh-meta')!.textContent).toBe('Normal (Escolha) · Meio');
  expect(first.querySelector('.rlc-mh-kda')!.textContent).toBe('8/2/11');
  expect(first.textContent).toContain('28:41');
  // Bot + suporte vira Suporte; ARAM não tem rota.
  expect(days[0]!.querySelectorAll('.rlc-mh-meta')[1]!.textContent).toBe('Ranqueada Solo/Duo · Suporte');
  expect(days[2]!.querySelector('.rlc-mh-meta')!.textContent).toBe('ARAM');
  // Coluna: elo por fila com barra de PdL, rotas das partidas carregadas, KDA em linha.
  const elo = [...sheet.querySelectorAll('.rlc-pf-elo')];
  expect(elo[0]!.textContent).toContain('Ouro II');
  expect(elo[0]!.textContent).toContain('Solo/Duo · 48 PdL');
  expect(elo[0]!.querySelector<HTMLElement>('.rlc-pf-bar i')!.style.width).toBe('48%');
  expect(elo[2]!.textContent).toContain('Sem classificação');
  const roles = sheet.querySelector('.rlc-pf-roles')!;
  expect([...roles.children].slice(3).map((c) => c.textContent)).toEqual(['Meio', '', '100%', 'Suporte', '', '0%']);
  expect(sheet.querySelector('.rlc-pf-kda polyline')!.getAttribute('points')!.split(' ')).toHaveLength(4);
  expect(sheet.textContent).toContain('média 9,5');
});

test('histórico: Esc, clicar na aba de novo ou trocar de aba descem o quadro', async () => {
  mount();
  await settle();
  await openHistory();
  esc();
  expect(root.querySelector('.rlc-pf-sheet')).toBeNull();
  expect(root.querySelector('.rlc-profile')!.getAttribute('data-tab')).toBe('summary');
  await openHistory();
  act(() => tab('Histórico').click());
  expect(root.querySelector('.rlc-pf-sheet')).toBeNull();
  await openHistory();
  act(() => tab('Ranqueadas').click());
  expect(root.querySelector('.rlc-pf-sheet')).toBeNull();
  expect(root.querySelectorAll('.rlc-rk-card')).toHaveLength(3);
});

test('histórico: filtro por fila; carregar mais', async () => {
  mount();
  await settle();
  await openHistory();
  const rows = () => [...root.querySelectorAll('.rlc-mh-row')];
  expect(rows().map((r) => r.getAttribute('data-win'))).toEqual(['true', 'false', 'true', 'false']);
  act(() => btn('Ranqueada').click());
  expect(rows()).toHaveLength(2);
  act(() => btn('Todas').click());
  act(() => btn('Carregar mais').click());
  await settle();
  await settle();
  expect(rows()).toHaveLength(5);
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
  // O detalhe abre dentro do quadro.
  const detail = root.querySelector('.rlc-pf-sheet > .rlc-md')!;
  expect(detail.querySelector('.rlc-md-result')!.textContent).toBe('Vitória');
  expect(detail.querySelectorAll('.rlc-md-team')).toHaveLength(2);
  expect(detail.textContent).toContain('<i>Zeca</i>');
  expect(detail.querySelector('i')).toBeNull();
  act(() => btn('Estatísticas').click());
  expect(detail.textContent).toContain('12.500');
  act(() => btn('Gráficos').click());
  await settle();
  expect(root.querySelectorAll('.rlc-md-chart polyline')).toHaveLength(2);
  // Eixos legíveis: ouro em passos redondos a partir de 0 e minutos embaixo; legenda com o ouro final de cada time.
  expect([...root.querySelectorAll('.rlc-md-grid text')].map((e) => e.textContent!.replace(/\s/g, ' '))).toEqual(['0', '500', '1 mil']);
  expect([...root.querySelectorAll('.rlc-md-axis')].map((e) => e.textContent)).toEqual(['0 min', '1 min']);
  expect([...root.querySelectorAll('.rlc-md-legend')].map((e) => e.textContent)).toEqual(['Time azul 900', 'Time vermelho 700']);
  // Dano por jogador: barras na escala do maior dano.
  expect([...root.querySelectorAll<HTMLElement>('.rlc-md-track .rlc-md-fill')].map((i) => i.style.width)).toEqual(['100%', `${(24000 / 31000) * 100}%`]);
  act(() => btn('‹ Histórico').click());
  expect(root.querySelector('.rlc-md')).toBeNull();
  expect(root.querySelectorAll('.rlc-pf-sheet .rlc-mh-row')).toHaveLength(4);
});

test('placar: ícones de campeão, feitiços, runas e os 7 encaixes de item (o 7º é o amuleto), farm por minuto e dano', async () => {
  mount();
  await settle();
  act(() => tab('Histórico').click());
  await settle();
  await settle();
  act(() => (root.querySelector('.rlc-mh-row') as HTMLButtonElement).click());
  await settle();
  await settle();
  const [blue, red] = [...root.querySelectorAll('.rlc-md-board')];
  const row = blue!.querySelector('tbody tr')!;
  expect(blue!.querySelector('thead')!.textContent).toContain('Time azul');
  expect(blue!.querySelector('thead')!.textContent).toContain('8/2/11');
  expect(red!.querySelector('thead')!.textContent).toContain('Time vermelho');
  expect(row.querySelector('.rlc-md-champ')!.getAttribute('src')).toBe('/i/103.png');
  expect(row.querySelector('.rlc-md-lvl')!.textContent).toBe('16');
  expect([...row.querySelectorAll('img.rlc-md-spell')].map((i) => i.getAttribute('alt'))).toEqual(['Flash', 'Incendiar']);
  expect([...row.querySelectorAll('img.rlc-md-rune')].map((i) => i.getAttribute('src'))).toEqual(['/r/8112.png', '/r/8200.png']);
  const slots = [...row.querySelectorAll('.rlc-md-item')];
  expect(slots).toHaveLength(7);
  expect(slots.map((s) => s.getAttribute('src'))).toEqual(['/it/3089.png', null, null, null, null, null, '/it/3340.png']);
  expect(row.textContent).toContain('214');
  expect(row.textContent).toContain('7,1/min');
  expect(row.textContent).toContain('31.000');
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

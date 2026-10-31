import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, queue, ready } from '../../test/fixtures';
import { relativeDay, teamGold } from './data';
import { Profile, RankedCards } from './Profile';
import { profileRequest } from '../../shell/nav';
import { HOVER_DELAY_MS } from './PlayerHover';

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
  gameId, queueId, mapId: queueId === 450 || queueId === 2400 ? 12 : 11, gameDuration: 1721, gameCreation: DAYS[gameId] ?? Date.UTC(2026, 9, 2, 14),
  participants: [part(1, 100, 103, { kills: 8, deaths: 2, assists: 11, win, champLevel: 14, totalMinionsKilled: 150, neutralMinionsKilled: 10, item0: 3089, item6: 3340, ...(queueId === 2400 ? {} : { perk0: 8112, perkSubStyle: 8200 }) }, lane, role)],
  participantIdentities: [ident(1, 'Fulano', 'me')],
});
const fullGame = {
  ...listGame(1, true),
  gameDuration: 1800,
  participants: [part(1, 100, 103, { kills: 8, deaths: 2, assists: 11, win: true, totalDamageDealtToChampions: 31000, goldEarned: 12500, visionScore: 30, totalMinionsKilled: 190, neutralMinionsKilled: 24, damageDealtToObjectives: 5000, item0: 3089, item1: 0, item6: 3340, champLevel: 16, perk0: 8112, perkSubStyle: 8200 }),
    part(6, 200, 238, { kills: 6, deaths: 5, assists: 2, win: false, totalDamageDealtToChampions: 24000, goldEarned: 11000, visionScore: 12, totalMinionsKilled: 170, neutralMinionsKilled: 0, damageDealtToObjectives: 2000 })],
  participantIdentities: [ident(1, 'Fulano', 'me'), { participantId: 6, player: { ...ident(6, '<i>Zeca</i>', 'z').player, summonerId: 66 } }],
};
const timeline = { frames: [{ timestamp: 0, participantFrames: { '1': { participantId: 1, totalGold: 500 }, '6': { participantId: 6, totalGold: 500 } } }, { timestamp: 60000, participantFrames: { '1': { participantId: 1, totalGold: 900 }, '6': { participantId: 6, totalGold: 700 } } }] };
const ranked = { queueMap: { RANKED_SOLO_5x5: { tier: 'GOLD', division: 'II', leaguePoints: 48, wins: 54, losses: 46, previousSeasonEndTier: 'GOLD', previousSeasonEndDivision: 'IV', highestTier: 'PLATINUM', highestDivision: 'IV' }, RANKED_FLEX_SR: { tier: 'SILVER', division: 'I', leaguePoints: 12, wins: 20, losses: 18 }, RANKED_TFT: { tier: '', division: 'NA', leaguePoints: 0, wins: 0, losses: 0, provisionalGamesRemaining: 3 }, RANKED_TFT_DOUBLE_UP: { tier: 'GOLD', division: 'I', leaguePoints: 10, wins: 3, losses: 1, provisionalGamesRemaining: 2 }, RANKED_PREMADE_5x5: { tier: 'BRONZE', division: 'III', leaguePoints: 20, wins: 2, losses: 2 }, JADE_RANKED_SOLO_5x5: { tier: 'SILVER', division: 'II', leaguePoints: 5, wins: 1, losses: 0 } } };
const mastery = [{ championId: 103, championLevel: 23, championPoints: 219000, championPointsSinceLastLevel: 2750, championPointsUntilNextLevel: 8250, lastPlayTime: 1000 }, { championId: 238, championLevel: 5, championPoints: 31000, championPointsSinceLastLevel: 0, championPointsUntilNextLevel: 0, lastPlayTime: 2000 }];

function routes(url: string): unknown {
  if (url === '/lol-summoner/v2/summoners/puuid/me') return { gameName: 'Fulano', tagLine: 'TAG', summonerLevel: 312, profileIconId: 29 };
  if (url === '/lol-match-history/v1/products/lol/me/matches') return { games: { games: [listGame(1, true), listGame(2, false, 420, 'BOTTOM', 'DUO_SUPPORT'), listGame(3, true, 440), listGame(4, false, 450), listGame(5, true, 2400)] } };
  if (url === '/lol-match-history/v1/games/1') return fullGame;
  if (url === '/lol-match-history/v1/game-timelines/1') return timeline;
  if (url === '/lol-ranked/v1/ranked-stats/me' || url === '/lol-ranked/v1/ranked-stats/z') return ranked;
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
  lcu.queues.value = ready([queue({ id: 400, name: 'Normal (Escolha)' }), queue({ id: 420, name: 'Ranqueada Solo/Duo' }), queue({ id: 450, name: 'ARAM' }), queue({ id: 710, type: 'RANKED_PREMADE_5x5', name: 'Ranqueada 5x5' }), queue({ id: 4310, type: 'JADE_RANKED_SOLO_5x5', name: '' })]) as Lcu['queues']['value'];
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
  expect(days.map((d) => d.querySelectorAll('.rlc-mh-row').length)).toEqual([2, 1, 2]);
  const first = days[0]!.querySelector('.rlc-mh-row')!;
  expect(first.querySelector('img')!.getAttribute('alt')).toBe('Ahri');
  expect(first.querySelector('.rlc-mh-result b')!.textContent).toBe('Vitória');
  expect(first.querySelector('.rlc-mh-meta')!.textContent).toBe('Normal (Escolha) · Meio');
  expect(first.querySelector('.rlc-mh-kda')!.textContent).toBe('8/2/11');
  expect(first.textContent).toContain('28:41');
  // Linha rica: nível, feitiços e runas, KDA médio, farm por minuto, itens e o placar do dia.
  expect(first.querySelector('.rlc-md-lvl')!.textContent).toBe('14');
  expect([...first.querySelectorAll('img.rlc-md-spell')].map((i) => i.getAttribute('alt'))).toEqual(['Flash', 'Incendiar']);
  expect([...first.querySelectorAll('img.rlc-md-rune')].map((i) => i.getAttribute('src'))).toEqual(['/r/8112.png', '/r/8200.png']);
  expect(first.querySelector('.rlc-mh-ratio')!.textContent).toBe('9,5 KDA');
  expect(first.querySelector('.rlc-mh-cs')!.textContent).toBe('160 CS5,6/min');
  expect([...first.querySelectorAll('.rlc-md-item')].map((i) => i.getAttribute('src'))).toEqual(['/it/3089.png', null, null, null, null, null, '/it/3340.png']);
  expect(days.map((d) => d.querySelector('.rlc-pf-tally')!.textContent)).toEqual(['1V 1D', '1V 0D', '1V 1D']);
  // Bot + suporte vira Suporte; ARAM não tem rota.
  expect(days[0]!.querySelectorAll('.rlc-mh-meta')[1]!.textContent).toBe('Ranqueada Solo/Duo · Suporte');
  expect(days[2]!.querySelector('.rlc-mh-meta')!.textContent).toBe('ARAM');
  // Coluna: elo por fila com barra de PdL, rotas das partidas carregadas, KDA em linha.
  const elo = [...sheet.querySelectorAll('.rlc-pf-elo')];
  expect(elo).toHaveLength(3);
  expect(elo[0]!.textContent).toContain('Ouro II');
  expect(elo[0]!.textContent).toContain('Solo/Duo · 48 PdL');
  expect(elo[0]!.querySelector<HTMLElement>('.rlc-pf-bar i')!.style.width).toBe('48%');
  expect(elo[2]!.textContent).toContain('Sem classificação');
  const roles = sheet.querySelector('.rlc-pf-roles')!;
  expect([...roles.children].slice(3).map((c) => c.textContent)).toEqual(['Meio', '', '100%', 'Suporte', '', '0%']);
  expect(sheet.querySelector('.rlc-pf-kda polyline')!.getAttribute('points')!.split(' ')).toHaveLength(5);
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
  // Ranqueadas sobe no mesmo quadro, abaixo do nome, como o histórico.
  const sheet = root.querySelector('.rlc-pf-sheet')!;
  expect(sheet.getAttribute('aria-label')).toBe('Ranqueadas');
  expect(sheet.querySelectorAll('.rlc-rk-card')).toHaveLength(4);
  expect(root.querySelector('.rlc-pf-showcase .rlc-pf-name')).not.toBeNull();
  esc();
  expect(root.querySelector('.rlc-pf-sheet')).toBeNull();
});

// A LCU ignora begIndex/endIndex e sempre manda as ~20 últimas: uma busca só, sem "carregar mais".
test('histórico: filtro por fila; uma busca só, sem carregar mais', async () => {
  mount();
  await settle();
  await openHistory();
  const rows = () => [...root.querySelectorAll('.rlc-mh-row')];
  expect(rows().map((r) => r.getAttribute('data-win'))).toEqual(['true', 'false', 'true', 'false', 'true']);
  // Sem fileira de chips: o lado ativo da chave LoL/TFT abre um menu pequeno com as filas.
  expect(root.querySelector('.rlc-queue-chip')).toBeNull();
  const game = () => root.querySelector<HTMLButtonElement>('.rlc-pf-game button[aria-pressed="true"]')!;
  const menu = () => root.querySelector<HTMLElement>('.rlc-pf-menu');
  const opts = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-pf-menu [role="option"]')];
  expect(menu()).toBeNull();
  expect(game().getAttribute('aria-haspopup')).toBe('listbox');
  act(() => game().click());
  expect(game().getAttribute('aria-expanded')).toBe('true');
  expect(opts().map((o) => o.textContent)).toEqual(['Todas', 'Ranqueada', 'Normal', 'ARAM']);
  expect(opts()[0]!.getAttribute('aria-selected')).toBe('true');
  act(() => opts()[1]!.click());
  expect(menu()).toBeNull();
  expect(rows()).toHaveLength(2);
  // A chave mostra a fila escolhida ao lado do jogo; a pílula do menu fica na opção ativa.
  expect(game().querySelector('small')!.textContent).toBe('Ranqueada');
  act(() => game().click());
  expect(menu()!.style.getPropertyValue('--i')).toBe('1');
  // Clique fora fecha sem trocar o filtro.
  act(() => void document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })));
  expect(menu()).toBeNull();
  expect(rows()).toHaveLength(2);
  act(() => game().click());
  act(() => opts()[0]!.click());
  expect(rows()).toHaveLength(5);
  expect(game().querySelector('small')).toBeNull();
  expect([...root.querySelectorAll('button')].some((b) => b.textContent === 'Carregar mais')).toBe(false);
  // ARAM Caos não tem runas: só os dois feitiços, empilhados.
  const mayhem = rows()[4]!.querySelector('.rlc-md-loadout')!;
  expect(mayhem.getAttribute('data-runes')).toBe('false');
  expect(mayhem.querySelectorAll('.rlc-md-spell')).toHaveLength(2);
  expect(mayhem.querySelectorAll('.rlc-md-rune')).toHaveLength(0);
  expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/matches'))).toHaveLength(1);
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
  expect(root.querySelectorAll('.rlc-pf-sheet .rlc-mh-row')).toHaveLength(5);
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

test('ranqueadas: um cartão por fila com elo, as três principais primeiro; fila sem elo ou sem nome no client fica de fora', async () => {
  mount();
  await settle();
  act(() => tab('Ranqueadas').click());
  await settle();
  const cards = [...root.querySelectorAll('.rlc-rk-card')];
  expect(cards.map((c) => c.querySelector('small')!.textContent)).toEqual(['Solo/Duo', 'Flex', 'TFT Dupla', 'Ranqueada 5x5']);
  expect(cards[0]!.textContent).toContain('Ouro II');
  expect(cards[0]!.textContent).toContain('48 PdL');
  // Cada cartão traz a própria temporada anterior, aproveitamento, pico e a barra de PdL até a próxima divisão.
  expect(cards[0]!.textContent).toContain('Temporada anterior: Ouro IV');
  expect(cards[0]!.textContent).toContain('54% de vitórias');
  expect(cards[0]!.textContent).toContain('Pico: Platina IV');
  expect(cards[1]!.textContent).not.toContain('Pico');
  expect(cards[0]!.querySelector<HTMLElement>('.rlc-rk-lp i')!.style.width).toBe('48%');
  expect(cards[2]!.textContent).toContain('Ouro I');
  expect(cards[2]!.textContent).toContain('2 partidas de classificação restantes');
});

test('ranqueadas: sem elo em nenhuma fila mostra só "Sem classificação"', () => {
  act(() => render(<RankedCards ranked={{ queueMap: { RANKED_SOLO_5x5: { tier: '', division: 'NA', provisionalGamesRemaining: 5 } } }} queues={[]} />, root));
  expect(root.querySelectorAll('.rlc-rk-card')).toHaveLength(0);
  expect(root.textContent).toBe('Sem classificação');
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

test('maestria: resumo, ordem por jogado há menos tempo, faixa do nível e progresso até o próximo', async () => {
  mount();
  await settle();
  act(() => tab('Maestria').click());
  await settle();
  await settle();
  expect(root.querySelector('.rlc-ms-sum')!.textContent!.replace(/\s/g, ' ')).toBe('2 campeões · 250 mil pontos');
  const rings = [...root.querySelectorAll('.rlc-ms-ring')].map((r) => r.getAttribute('data-tier'));
  expect(rings).toEqual(['high', 'mid']);
  const bars = [...root.querySelectorAll<HTMLElement>('.rlc-ms-bar i')].map((b) => b.style.width);
  // Ahri: 2750 de 11000 = 25%; Zed sem próximo nível informado fica sem barra.
  expect(bars).toEqual(['25%']);
  act(() => btn('Recentes').click());
  expect([...root.querySelectorAll('.rlc-ms-champ')].map((c) => c.getAttribute('aria-label'))).toEqual(['Zed', 'Ahri']);
});

test('dia relativo e ouro por time', () => {
  const now = Date.UTC(2026, 9, 5, 18);
  expect(relativeDay(Date.UTC(2026, 9, 5, 9), now)).toBe('hoje');
  expect(relativeDay(Date.UTC(2026, 9, 4, 9), now)).toBe('ontem');
  expect(teamGold(timeline as never, { 1: 100, 6: 200 })).toEqual({ blue: [500, 900], red: [500, 700], minutes: [0, 1] });
});

test('histórico: roda de carregamento enquanto as partidas não chegam', async () => {
  let release: () => void = () => {};
  const slow = new Promise<void>((r) => (release = r));
  const base = fetchMock.getMockImplementation() as (url: string) => Promise<Response>;
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes('/lol-match-history/v1/products/lol/')) await slow;
    return base(url);
  });
  mount();
  await settle();
  act(() => tab('Histórico').click());
  await settle();
  expect(root.querySelector('.rlc-mh .rlc-loader')).not.toBeNull();
  release();
  await settle();
  await settle();
  expect(root.querySelector('.rlc-mh .rlc-loader')).toBeNull();
  expect(root.querySelectorAll('.rlc-mh-row').length).toBeGreaterThan(0);
});

/** Detalhe da partida 1 aberto, com a raiz do tema (para os menus e cartões soltos na tela). */
async function openDetail(over: { lobby?: boolean } = {}) {
  root.id = 'rlc-root';
  const lcu = mount();
  lcu.chatMe.value = ready({ puuid: 'me' }) as never;
  if (over.lobby) lcu.lobby.value = ready({ partyId: 'p' }) as never;
  await settle();
  act(() => tab('Histórico').click());
  await settle();
  await settle();
  act(() => (root.querySelector('.rlc-mh-row') as HTMLButtonElement).click());
  await settle();
  await settle();
  return lcu;
}
const nameCell = (name: string) => [...root.querySelectorAll('.rlc-md-name')].find((td) => td.textContent?.includes(name))!;
const floatingMenu = () => root.querySelector(':scope > .rlc-menu[data-floating]');

test('histórico: ações por jogador (menos eu) num menu solto na tela; denúncia pelo caminho do histórico', async () => {
  await openDetail({ lobby: true });
  expect(nameCell('Fulano').querySelector('.rlc-col-menu')).toBeNull();
  act(() => nameCell('Zeca').querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  // Fora da tabela (que corta o que passa da borda): solto na raiz do tema.
  expect(floatingMenu()).not.toBeNull();
  expect([...floatingMenu()!.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Ver perfil', 'Convidar para o lobby', 'Adicionar', 'Denunciar']);
  act(() => [...floatingMenu()!.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Denunciar')!.click());
  const dialog = root.querySelector(':scope > .rlc-veil[role="dialog"]')!;
  act(() => dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  act(() => [...dialog.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Enviar denúncia')!.click());
  await settle();
  const sent = fetchMock.mock.calls.find((c) => c[0] === '/lol-player-report-sender/v1/match-history-reports')!;
  expect(JSON.parse(sent[1].body)).toMatchObject({ gameId: 1, offenderPuuid: 'z', categories: ['LEAVING_AFK'] });
});

test('histórico: passados 5 dias não dá mais para denunciar; sem lobby, sem convite; Ver perfil abre o perfil dele', async () => {
  vi.setSystemTime(NOW + 6 * 864e5);
  await openDetail();
  act(() => nameCell('Zeca').querySelector<HTMLButtonElement>('.rlc-col-menu')!.click());
  expect([...floatingMenu()!.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Ver perfil', 'Adicionar']);
  act(() => [...floatingMenu()!.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Ver perfil')!.click());
  expect(profileRequest.value).toBe('z');
  profileRequest.value = null;
});

test('histórico: mouse parado no nome mostra fundo de perfil, Riot ID e elo, sem abrir o perfil; sai e some', async () => {
  await openDetail();
  const hover = nameCell('Zeca').querySelector('.rlc-phover')!;
  act(() => void hover.dispatchEvent(new MouseEvent('mouseenter')));
  expect(root.querySelector('.rlc-pcard')).toBeNull();
  await act(async () => void (await new Promise((r) => setTimeout(r, HOVER_DELAY_MS + 50))));
  await settle();
  const card = root.querySelector(':scope > .rlc-pcard')!;
  expect(card.textContent).toContain('<i>Zeca</i>');
  expect(card.textContent).toContain('Solo/Duo');
  expect(card.textContent).toContain('48 PdL');
  act(() => void hover.dispatchEvent(new MouseEvent('mouseleave')));
  expect(root.querySelector('.rlc-pcard')).toBeNull();
});

test('o voltar do detalhe fica preso no topo enquanto o placar rola', async () => {
  await openDetail();
  const back = root.querySelector('.rlc-md > .rlc-md-back')!;
  expect(back.textContent).toBe('‹ Histórico');
  const css = (await import('node:fs')).readFileSync('src/ui/css/profile.css', 'utf8');
  expect(css).toMatch(/\.rlc-md > \.rlc-md-back \{[^}]*position: sticky; top: 0;/);
});

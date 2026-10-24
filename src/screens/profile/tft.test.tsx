import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import type { Lcu } from '../../lcu';
import { fakeLcu, queue, ready } from '../../test/fixtures';
import { Profile } from './Profile';
import { prettyId, tftMatches, tftStats } from './tft';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

// Formato copiado de `/lol-match-history/v1/products/tft/{puuid}/matches` (set 18), com nomes e puuids trocados.
const NOW = Date.UTC(2026, 9, 5, 18);
const unit = (character_id: string, rarity: number, tier: number, itemNames: string[] = []) => ({ character_id, itemNames, name: '', rarity, tier });
const trait = (name: string, num_units: number, style: number, tier_current = style ? 1 : 0, tier_total = 3) => ({ name, num_units, style, tier_current, tier_total });
const player = (puuid: string, riotIdGameName: string, placement: number, extra: Record<string, unknown> = {}) => ({
  companion: { content_ID: puuid === 'me' ? 'comp-janna' : 'comp-x', item_ID: 108002, skin_ID: 0, species: '' },
  gold_left: 0, last_round: 34, level: 8, missions: { PlayerScore2: 210 }, placement, players_eliminated: 0, puuid, riotIdGameName, riotIdTagline: 'BR1',
  time_eliminated: 2112, total_damage_to_players: 0, win: placement <= 4,
  traits: [trait('DA_18_Blossom', 3, 1), trait('DA_18_Rapidfire', 1, 0)],
  units: [unit('DA_18_Leona', 0, 2)],
  ...extra,
});
const me = player('me', 'Fulano', 4, {
  traits: [trait('DA_18_Blossom', 3, 1, 1, 5), trait('DA_18_Defender', 2, 1), trait('DA_18_Rapidfire', 1, 0, 0, 4), trait('DA_18_Solar', 3, 4, 1, 1), trait('DA_FloraFatalis18', 2, 4, 2, 2)],
  units: [
    unit('DA_Karma18', 0, 3, ['DA_JeweledGauntlet', 'DA_BlueBuff', 'DA_HextechGunblade']), unit('DA_18_Leona', 0, 3), unit('DA_18_Yorick', 0, 3),
    unit('DA_18_Yunara', 1, 3, ['DA_Deathblade']), unit('DA_18_Sejuani', 1, 3), unit('DA_18_Kayle', 1, 2), unit('DA_Fiddlesticks18', 2, 2),
    unit('DA_18_Soraka', 3, 1, ['DA_RedBuff']), unit('TFT15_Ahri', 4, 1), unit('DA_18_Veigar', 0, 1),
  ],
});
const others = ['Zeca', 'Bia', 'Caio', 'Duda', 'Edu', 'Fê', 'Gui'];
const ranked = {
  json: {
    endOfGameResult: 'GameComplete', gameCreation: Date.UTC(2026, 9, 5, 14), gameId: 3295264466, game_datetime: String(Date.UTC(2026, 9, 5, 14, 39)), game_id: 3295264466,
    game_length: 2341.462158203125, game_version: 'TFT Unreal Version ?.?.?.?', mapId: 22, product_id: 'TFT', queueId: 1100, queue_id: 1100,
    tft_game_type: 'standard', tft_set_core_name: 'TFTSet18', tft_set_number: 18,
    participants: [me, ...others.map((n, i) => player(`p${i}`, n, i < 3 ? i + 1 : i + 2))],
  },
  metadata: { data_version: 6, info_type: 'summary', match_id: 'BR1_3295264466', participants: [], private: false, product: 'tft', tags: ['ranked'], timestamp: 0 },
};
const doubleUp = {
  json: {
    ...ranked.json, gameId: 3290935696, game_id: 3290935696, gameCreation: Date.UTC(2026, 9, 4, 20), game_length: 1805, queueId: 1160, queue_id: 1160,
    participants: [player('me', 'Fulano', 2, { partner_group_id: 1 }), ...others.map((n, i) => player(`p${i}`, n, i === 0 ? 1 : i + 2, { partner_group_id: i === 0 ? 1 : 2 + Math.floor((i + 1) / 2) }))],
  },
  metadata: ranked.metadata,
};
const rankedStats = { queueMap: { RANKED_SOLO_5x5: { tier: 'GOLD', division: 'II', leaguePoints: 48, wins: 54, losses: 46 }, RANKED_TFT: { tier: 'DIAMOND', division: 'II', leaguePoints: 39, wins: 71, losses: 36 } } };

function routes(url: string): unknown {
  if (url === '/lol-summoner/v2/summoners/puuid/me') return { gameName: 'Fulano', tagLine: 'TAG', summonerLevel: 312, profileIconId: 29 };
  if (url.startsWith('/lol-match-history/v1/products/lol/me/matches')) return { games: { games: [] } };
  if (url === '/lol-match-history/v1/products/tft/me/matches?begin=0&count=20') return { active_puuid: '', games: [ranked, doubleUp] };
  if (url === '/lol-ranked/v1/ranked-stats/me') return rankedStats;
  if (url === '/lol-game-data/assets/v1/tftchampions.json')
    return ['DA_Karma18', 'DA_18_Leona', 'DA_18_Yorick', 'DA_18_Yunara', 'DA_18_Sejuani', 'DA_18_Kayle', 'DA_Fiddlesticks18', 'DA_18_Soraka', 'DA_18_Veigar'].map((id) => ({
      name: id, character_record: { character_id: id, rarity: 9, display_name: prettyId(id), traits: [], squareIconPath: `/u/${id}.png` },
    }));
  if (url === '/lol-game-data/assets/v1/tftitems.json')
    return [['DA_JeweledGauntlet', 'Manopla Adornada'], ['DA_BlueBuff', 'Bênção Azul'], ['DA_RedBuff', 'Bênção Vermelha']].map(([nameId, name]) => ({ guid: '', name, nameId, id: 0, squareIconPath: `/it/${nameId}.png` }));
  if (url === '/lol-game-data/assets/v1/tfttraits.json')
    return [['DA_18_Blossom', 'Florescer'], ['DA_18_Defender', 'Defensor'], ['DA_18_Solar', 'Solar'], ['DA_FloraFatalis18', 'Flora Fatalis']].map(([trait_id, display_name]) => ({ trait_id, display_name, set: 'TFTSet18', icon_path: `/t/${trait_id}.png` }));
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

async function openTft() {
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, companions: async () => new Map([['comp-janna', { itemId: 108002, name: 'Janna Chibi', icon: '/c/janna.png' }]]) };
  lcu.queues.value = ready([queue({ id: 1100, name: 'Teamfight Tactics (Ranqueada)', description: 'Ranqueada', gameMode: 'TFT' }), queue({ id: 1160, name: 'Teamfight Tactics (Double Up)', description: 'Double Up', gameMode: 'TFT' })]) as Lcu['queues']['value'];
  act(() => render(<Profile lcu={lcu} puuid="me" />, root));
  await settle();
  act(() => [...root.querySelectorAll<HTMLButtonElement>('.rlc-tabs-text button')].find((b) => b.textContent === 'Histórico')!.click());
  await settle();
  act(() => btn('TFT').click());
  await settle();
  await settle();
}

test('TFT: seletor de jogo troca o feed; linhas por dia com colocação, Pequena Lenda, composição, traços, fila e duração', async () => {
  await openTft();
  expect(btn('TFT').getAttribute('aria-pressed')).toBe('true');
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-match-history/v1/products/tft/me/matches?begin=0&count=20')).toBe(true);
  const days = [...root.querySelectorAll('.rlc-pf-day')];
  expect(days.map((d) => d.querySelector('h3')!.textContent)).toEqual(['hoje', 'ontem']);
  const row = days[0]!.querySelector('.rlc-tft-row')!;
  expect(row.getAttribute('data-band')).toBe('top');
  expect(row.querySelector('.rlc-tft-place')!.textContent).toBe('4º');
  expect(row.querySelector<HTMLImageElement>('.rlc-tft-legend')!.alt).toBe('Janna Chibi');
  // Até 9 unidades, do custo mais alto ao mais baixo; sem catálogo, o nome sai do id (nada de "TFT15_Ahri").
  const units = [...row.querySelectorAll('.rlc-tft-unit')];
  expect(units).toHaveLength(9);
  expect(units.map((u) => u.getAttribute('title')).slice(0, 3)).toEqual(['Ahri', 'Soraka', 'Fiddlesticks']);
  expect(units[0]!.getAttribute('data-cost')).toBe('5');
  expect(units[0]!.querySelector('img')).toBeNull();
  expect(units[3]!.querySelector('.rlc-tft-stars')!.textContent).toBe('★★★');
  // Traços ativos, prismáticos primeiro; os inativos não aparecem.
  expect([...row.querySelectorAll('.rlc-tft-trait')].map((tr) => tr.getAttribute('title'))).toEqual(['Solar (3)', 'Flora Fatalis (2)', 'Florescer (3)', 'Defensor (2)']);
  expect(row.querySelector('.rlc-mh-meta')!.textContent).toBe('Ranqueada');
  expect(row.querySelector('small')!.textContent).toBe('39:01');
  // Double Up: a colocação é a da dupla (2º individual = 1º).
  const du = days[1]!.querySelector('.rlc-tft-row')!;
  expect(du.querySelector('.rlc-tft-place')!.textContent).toBe('1º');
  expect(du.getAttribute('data-band')).toBe('first');
  expect(root.textContent).not.toMatch(/DA_|TFT\d/);
});

test('TFT: chips das filas que existem e coluna com elo, médias e mais usados; voltar para LoL', async () => {
  await openTft();
  const chips = [...root.querySelectorAll('.rlc-queue-chip')].map((c) => c.textContent);
  expect(chips).toEqual(['Todas', 'Ranqueada', 'Double Up']);
  act(() => btn('Double Up').click());
  expect(root.querySelectorAll('.rlc-tft-row')).toHaveLength(1);
  const elo = [...root.querySelectorAll('.rlc-pf-elo')];
  expect(elo[0]!.textContent).toContain('Diamante II');
  expect(elo[0]!.textContent).toContain('Ranqueada · 39 PdL');
  expect([...root.querySelectorAll('.rlc-tft-numbers dd')].map((d) => d.textContent)).toEqual(['3,0', '100%', '50%']);
  expect([...root.querySelectorAll('.rlc-tft-strip li')].map((l) => l.textContent)).toEqual(['4', '1']);
  expect(root.querySelector('.rlc-tft-top li span')!.textContent).toBe('Florescer');
  act(() => btn('LoL').click());
  expect(root.querySelector('.rlc-tft-row')).toBeNull();
  expect(root.querySelector('.rlc-pf-kda, .rlc-mh')).not.toBeNull();
});

test('TFT: clique abre a classificação dos oito com nível, itens e traços; voltar', async () => {
  await openTft();
  act(() => (root.querySelector('.rlc-tft-row') as HTMLButtonElement).click());
  expect(root.querySelector('.rlc-md-result')!.textContent).toBe('4º');
  expect(root.querySelector('.rlc-md .rlc-muted')!.textContent).toBe('Ranqueada · 39:01 · hoje');
  const rows = [...root.querySelectorAll('.rlc-tft-standings > li')];
  expect(rows.map((r) => r.querySelector('.rlc-tft-place')!.textContent)).toEqual(['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º']);
  const mine = rows[3]!;
  expect(mine.getAttribute('data-me')).toBe('true');
  expect(mine.querySelector('.rlc-tft-who')!.textContent).toBe('Fulanonível 8');
  expect(mine.querySelectorAll('.rlc-tft-unit')).toHaveLength(10);
  expect([...mine.querySelectorAll('.rlc-tft-items img')].map((i) => i.getAttribute('alt'))).toEqual(['Bênção Vermelha', 'Manopla Adornada', 'Bênção Azul']);
  expect(rows[7]!.getAttribute('data-band')).toBe('bottom');
  act(() => btn('‹ Histórico').click());
  expect(root.querySelectorAll('.rlc-tft-row')).toHaveLength(2);
});

test('nomes legíveis dos ids e estatísticas das últimas partidas', () => {
  expect(['TFT15_Ahri', 'DA_Gromp18_AP', 'DA_18_Akali_AD', 'TFT_Item_JeweledGauntlet', 'DA_FloraFatalis18'].map(prettyId)).toEqual(['Ahri', 'Gromp', 'Akali AD', 'Jeweled Gauntlet', 'Flora Fatalis']);
  const s = tftStats(tftMatches({ games: [ranked, doubleUp] }), 'me');
  expect(s).toMatchObject({ games: 2, avg: 3, top4: 2, wins: 1 });
  expect(s.units[0]).toEqual(['DA_18_Leona', 2]);
  expect(tftMatches(null)).toEqual([]);
});

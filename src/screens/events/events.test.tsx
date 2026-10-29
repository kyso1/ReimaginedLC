import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { fakeLcu } from '../../test/fixtures';
import { eventPass, missionCards, tftPass, type HubEvent, type TftPass } from './data';
import { Events, PassView, pendingClaims } from './Events';

// Dados no formato das respostas reais da LCU (GET), com nomes neutros.
const EV = 'ev-1';
const DAY = 86_400_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const event = (over: Partial<HubEvent['eventInfo']> = {}, id = EV): HubEvent => ({
  eventId: id,
  eventInfo: {
    eventName: 'Temporada de Teste', localizedShortName: '', eventType: 'kSeasonPass', startDate: iso(-DAY), endDate: iso(10 * DAY), progressEndDate: iso(5 * DAY),
    isPassPurchased: false, unclaimedRewardCount: 2, eventPassBundles: [{}], ...over,
  },
});
const option = (headerType: string, rewardName: string, state: string, types = ['SUMMONER_ICON']) => ({
  rewardGroupId: `grp-${rewardName}`, headerType, rewardName, rewardDescription: `Descrição de ${rewardName}`, thumbIconPath: `/i/${rewardName}.png`, rewardInventoryTypes: types, state,
});
const ITEMS = [
  { threshold: '1', rewardOptions: [option('FREE', 'Ícone A', 'Selected')] },
  { threshold: '2', rewardOptions: [option('FREE', 'Moedas', 'Unselected', ['CURRENCY']), option('PREMIUM', 'Orbe', 'Locked', ['HEXTECH_CRAFTING'])] },
  { threshold: '3', rewardOptions: [option('FREE', 'Emote B', 'Unlocked', ['EMOTE'])] },
];
const OBJECTIVES = [{
  objectivesCategories: [{
    id: EV,
    objectives: [{
      localizedTitle: ['Diária'],
      missions: [{
        title: '', status: 'PENDING', startTime: Date.now() - DAY, endTime: Date.now() + DAY,
        objectives: [{ description: 'Ganhe <a href="x">uma</a> partida', progress: { currentProgress: 0, totalCount: 1 } }],
        rewards: [{ description: '100 XP' }],
      }],
    }],
  }],
}];

let root: HTMLElement;
let routes: Record<string, unknown>;
let fetchMock: ReturnType<typeof vi.fn>;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const tabs = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-ev-tabs button')].map((b) => b.textContent);
const tab = (text: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-ev-tabs button')].find((b) => b.textContent === text)!;

beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  routes = {
    '/lol-event-hub/v1/events': [event(), event({ eventType: 'kActivityCenterMilestones', eventName: 'Marcos' }, 'ev-2')],
    [`/lol-event-hub/v1/events/${EV}/reward-track/items`]: ITEMS,
    [`/lol-event-hub/v1/events/${EV}/reward-track/progress`]: { level: 2, currentLevelXP: 459, totalLevelXP: 500, totalLevels: 3 },
    [`/lol-event-hub/v1/events/${EV}/chapters`]: { chapters: [{ backgroundImage: '/bg/cap1.png', chapterStart: 1, chapterEnd: 8 }] },
    '/lol-objectives/v1/objectives/lol': OBJECTIVES,
    '/lol-clash/v1/player': { tier: 2, tickets: { BASIC: 1, PREMIUM: 0 }, isClashBanned: false },
    '/lol-clash/v1/rewards': { seasonVp: 1450 },
    '/lol-clash/v1/all-tournaments': [],
  };
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method && init.method !== 'GET') {
      // O claim-all resgata no servidor: a próxima leitura já vem sem pendência.
      if (url.endsWith('/claim-all')) {
        routes['/lol-event-hub/v1/events'] = [event({ unclaimedRewardCount: 0 })];
        routes[`/lol-event-hub/v1/events/${EV}/reward-track/items`] = ITEMS.map((it) => ({ ...it, rewardOptions: it.rewardOptions.map((o) => (o.state === 'Unselected' ? { ...o, state: 'Selected' } : o)) }));
      }
      return new Response(null, { status: 204 });
    }
    return url in routes ? new Response(JSON.stringify(routes[url]), { status: 200 }) : new Response('', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
});

async function mount() {
  act(() => render(<Events lcu={fakeLcu()} />, root));
  for (let i = 0; i < 4; i++) await settle();
}

test('abas só para o que tem dados: evento com trilha; marcos, TFT sem passe e Clash (tela própria) ficam de fora', async () => {
  await mount();
  expect(tabs()).toEqual(['Temporada de Teste']);
});

test('trilha: três estados (resgatado, resgatável, bloqueado por passe ou nível), nível atual, arte e prazo', async () => {
  await mount();
  const cells = [...root.querySelectorAll<HTMLElement>('.rlc-ev-lvl')];
  const cell = (i: number, row: string) => cells[i]!.querySelector<HTMLElement>(`[data-row="${row}"]`)!;
  expect(cells.map((c) => c.querySelector('i')!.textContent)).toEqual(['1', '2', '3']);
  expect(cells[1]!.dataset.current).toBe('true');
  // Resgatado: marca de concluído, sem selo nem cadeado.
  expect(cell(0, 'free').dataset.state).toBe('claimed');
  expect(cell(0, 'free').querySelector('.rlc-ev-check')).not.toBeNull();
  expect(cell(0, 'free').querySelector('.rlc-ev-tag, .rlc-ev-lock')).toBeNull();
  // Resgatável: selo Resgatar no próprio bloco.
  expect(cell(1, 'free').dataset.state).toBe('ready');
  expect(cell(1, 'free').querySelector('.rlc-ev-tag')!.textContent).toBe('Resgatar');
  // Bloqueados: premium sem passe e nível futuro, com cadeado e balão explicando.
  expect(cell(1, 'premium').dataset.state).toBe('pass');
  expect(cell(1, 'premium').querySelector('.rlc-ev-lock')).not.toBeNull();
  expect(cell(1, 'premium').title).toContain('Requer passe premium');
  expect(cell(2, 'free').dataset.state).toBe('level');
  expect(cell(2, 'free').querySelector('.rlc-ev-lock')).not.toBeNull();
  expect(cell(2, 'free').querySelector('.rlc-ev-tag')).toBeNull();
  expect(cell(2, 'free').title).toContain('Disponível no nível 3');
  expect(cells[0]!.querySelector('[data-row="premium"]')!.getAttribute('data-empty')).toBe('true');
  expect(root.querySelector<HTMLElement>('.rlc-ev-bg')!.style.backgroundImage).toContain('/bg/cap1.png');
  expect(root.querySelector('.rlc-ev-head')!.textContent).toContain('termina em 5 dias');
});

test('nível escolhido aparece grande à esquerda com tipo, descrição e estado', async () => {
  await mount();
  const sel = () => root.querySelector('.rlc-ev-sel')!.textContent!;
  // Começa na primeira recompensa resgatável.
  expect(sel()).toContain('Moedas');
  expect(sel()).toContain('Pronto para resgatar');
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-ev-lvl')[1]!.querySelector<HTMLButtonElement>('[data-row="premium"]')!.click());
  expect(sel()).toContain('Orbe');
  expect(sel()).toContain('Espólio');
  expect(sel()).toContain('Requer passe premium');
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-ev-lvl')[2]!.querySelector<HTMLButtonElement>('[data-row="free"]')!.click());
  expect(sel()).toContain('Emote B');
  expect(sel()).toContain('Descrição de Emote B');
  expect(sel()).toContain('Disponível no nível 3');
  // Clicar em bloqueado só mostra o detalhe: nenhuma escrita na LCU.
  expect(fetchMock.mock.calls.some((c) => c[1]?.method)).toBe(false);
  act(() => root.querySelectorAll<HTMLButtonElement>('.rlc-ev-lvl')[0]!.querySelector<HTMLButtonElement>('[data-row="free"]')!.click());
  expect(sel()).toContain('Resgatado');
});

test('barra de XP, Comprar passe sem compra e missões sem HTML', async () => {
  await mount();
  const bar = root.querySelector<HTMLElement>('.rlc-ev-xp')!;
  expect(bar.getAttribute('aria-valuenow')).toBe('459');
  expect(bar.querySelector<HTMLElement>('i')!.style.width).toBe('91.8%');
  expect(root.querySelector('.rlc-ev-foot')!.textContent).toContain('459/500 XP');
  const buy = [...root.querySelectorAll<HTMLButtonElement>('.rlc-ev-buy button')].find((b) => b.textContent === 'Comprar passe')!;
  act(() => buy.click());
  expect(root.querySelector('.rlc-ev-buy')!.textContent).toContain('client original');
  expect(fetchMock.mock.calls.some((c) => c[1]?.method)).toBe(false);
  const mission = root.querySelector('.rlc-ev-mission')!.textContent!;
  expect(mission).toContain('Ganhe uma partida');
  expect(mission).toContain('0/1');
  expect(mission).toContain('100 XP');
});

const claimAllButton = () => [...root.querySelectorAll<HTMLButtonElement>('.rlc-ev-claimbar button')].find((b) => b.textContent === 'Resgatar tudo');
const claimCalls = () => fetchMock.mock.calls.filter((c) => String(c[0]).includes('claim-all'));

test('topo mostra quantas faltam e Resgatar tudo chama claim-all; depois do resgate o botão some', async () => {
  await mount();
  expect(root.querySelector('.rlc-ev-claimbar')!.textContent).toContain('2 para resgatar');
  act(() => claimAllButton()!.click());
  for (let i = 0; i < 8; i++) await settle();
  expect(claimCalls()).toHaveLength(1);
  expect(claimCalls()[0]![0]).toBe(`/lol-event-hub/v1/events/${EV}/reward-track/claim-all`);
  expect(claimCalls()[0]![1].method).toBe('POST');
  expect(root.querySelector('.rlc-ev-claimbar')).toBeNull();
  const free2 = root.querySelectorAll('.rlc-ev-lvl')[1]!.querySelector<HTMLElement>('[data-row="free"]')!;
  expect(free2.dataset.state).toBe('claimed');
  expect(free2.querySelector('.rlc-ev-tag')).toBeNull();
});

test('clicar no bloco resgatável resgata direto (claim-all, como o client oficial)', async () => {
  await mount();
  act(() => root.querySelectorAll('.rlc-ev-lvl')[1]!.querySelector<HTMLButtonElement>('[data-row="free"]')!.click());
  for (let i = 0; i < 8; i++) await settle();
  expect(claimCalls()).toHaveLength(1);
  expect(root.querySelector('.rlc-ev-lvl [data-state="ready"]')).toBeNull();
});

test('recompensa de escolha abre o seletor e confirma pela concessão do lol-rewards', async () => {
  routes['/lol-rewards/v1/grants'] = [{
    info: { id: 'g1', rewardGroupId: 'grp-Moedas', status: 'PENDING_SELECTION' },
    rewardGroup: {
      selectionStrategyConfig: { minSelectionsAllowed: 1, maxSelectionsAllowed: 1 },
      rewards: [
        { id: 'r1', localizations: { title: 'Campeão A' }, media: { iconUrl: '/a.png' } },
        { id: 'r2', localizations: { title: 'Campeão B' }, media: { iconUrl: '/b.png' } },
      ],
    },
  }];
  await mount();
  const block = root.querySelectorAll('.rlc-ev-lvl')[1]!.querySelector<HTMLButtonElement>('[data-row="free"]')!;
  expect(block.querySelector('.rlc-ev-tag')!.textContent).toBe('Escolher');
  act(() => block.click());
  expect(claimCalls()).toHaveLength(0);
  const dialog = root.querySelector('[role="dialog"]')!;
  const confirm = dialog.querySelector<HTMLButtonElement>('button[data-variant="primary"]')!;
  expect(confirm.disabled).toBe(true);
  act(() => [...dialog.querySelectorAll<HTMLButtonElement>('.rlc-ev-option')].find((b) => b.textContent === 'Campeão B')!.click());
  act(() => root.querySelector<HTMLButtonElement>('[role="dialog"] button[data-variant="primary"]')!.click());
  await settle();
  const call = fetchMock.mock.calls.find((c) => String(c[0]).includes('/select'))!;
  expect(call[0]).toBe('/lol-rewards/v1/grants/g1/select');
  expect(call[1].method).toBe('POST');
  expect(JSON.parse(call[1].body)).toEqual({ grantId: 'g1', rewardGroupId: 'grp-Moedas', selections: ['r2'] });
});

test('a trilha abre já na primeira recompensa resgatável, mesmo longe do começo', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ threshold: String(i + 1), rewardOptions: [option('FREE', `R${i + 1}`, i < 19 ? 'Selected' : i === 19 ? 'Unselected' : 'Unlocked')] }));
  const pass = eventPass(event(), items, { level: 25, currentLevelXP: 0, totalLevelXP: 500, totalLevels: 30 }, null);
  act(() => render(<PassView pass={pass} missions={[]} onChanged={() => {}} />, root));
  const shown = [...root.querySelectorAll('.rlc-ev-lvl i')].map((i) => Number(i.textContent));
  expect(shown).toContain(20);
  expect(root.querySelector('.rlc-ev-sel')!.textContent).toContain('R20');
});


const TFT: TftPass = {
  info: { passId: 'tft-1', title: 'Passe de Teste', endDate: Date.now() + 3 * DAY, premium: false },
  currentLevel: 2,
  activeMilestone: { level: 3, title: 'x', description: '', iconImageUrl: '', isPaid: false, isLocked: false, status: 'ACTIVE', pointsEarnedForMilestone: 700, pointsNeededForMilestone: 1000 },
  milestones: [
    { level: 0, title: '200 Fichas', description: 'Abrir', iconImageUrl: '/t/0.png', isPaid: true, isLocked: true, status: 'REWARDABLE', pointsEarnedForMilestone: 0, pointsNeededForMilestone: 0 },
    { level: 1, title: 'Pequena Lenda', description: '', iconImageUrl: '/t/1.png', isPaid: false, isLocked: false, status: 'COMPLETE', pointsEarnedForMilestone: 1000, pointsNeededForMilestone: 1000 },
    { level: 2, title: 'Moedas', description: '', iconImageUrl: '/t/2.png', isPaid: false, isLocked: false, status: 'REWARDABLE', pointsEarnedForMilestone: 1000, pointsNeededForMilestone: 1000 },
    { level: 2, title: 'Arena', description: '', iconImageUrl: '/t/2p.png', isPaid: true, isLocked: true, status: 'UPCOMING', pointsEarnedForMilestone: 0, pointsNeededForMilestone: 1000 },
  ],
};

test('passe do TFT: marcos viram níveis com fila, resgate pendente e XP do marco ativo', () => {
  const p = tftPass(TFT);
  expect(p.levels.map((l) => l.level)).toEqual([0, 1, 2]);
  expect(p.levels[0]!.premium).toMatchObject({ name: '200 Fichas', locked: true, claimed: false });
  expect(p.levels[1]!.free).toMatchObject({ claimed: true, locked: false });
  expect(p.levels[2]!.premium?.name).toBe('Arena');
  expect(p.unclaimed).toBe(1);
  expect([p.xp, p.xpTotal, p.level, p.buyable]).toEqual([700, 1000, 2, true]);
});

test('passe do TFT vira aba; Resgatar usa a rota do TFT', async () => {
  routes['/lol-tft-pass/v1/active-passes'] = [TFT];
  await mount();
  expect(tabs()).toContain('Passe do TFT');
  act(() => tab('Passe do TFT').click());
  expect(root.querySelector('.rlc-ev-claimbar')!.textContent).toContain('1 para resgatar');
  act(() => claimAllButton()!.click());
  await settle();
  const call = fetchMock.mock.calls.find((c) => String(c[0]).includes('claimAllRewards'))!;
  expect(call[0]).toBe('/lol-tft-pass/v1/pass/tft-1/milestone/claimAllRewards');
  expect(call[1].method).toBe('PUT');
});

test('Reinos dos Tesouros: só ativos, com moedas da carteira; giro sem fichas suficientes fica desligado', async () => {
  routes['/lol-tft-troves/v1/banners'] = [
    { id: 'b1', name: 'Reino Ativo ', backgroundTexture: '/b1.png', thumbnailTexture: '', startDate: iso(-DAY), endDate: iso(2 * DAY), pullCost: 50 },
    { id: 'b2', name: 'Reino Velho', backgroundTexture: '/b2.png', thumbnailTexture: '', startDate: iso(-9 * DAY), endDate: iso(-DAY), pullCost: 50 },
  ];
  routes['/lol-inventory/v1/wallet/0'] = { TFT_TREASURE_TROVE_TOKEN: 100, tft_star_fragments: 2300, RP: 5 };
  await mount();
  act(() => tab('Reinos dos Tesouros').click());
  expect([...root.querySelectorAll('.rlc-ev-trove b')].map((b) => b.textContent)).toEqual(['Reino Ativo']);
  const wallet = root.querySelector('.rlc-ev-wallet')!.textContent!;
  expect(wallet).toContain('100 Fichas do Tesouro');
  expect(wallet).toContain('2.300 Fragmentos Estelares');
  expect(wallet).not.toContain('RP');
  const roll = (n: string) => [...root.querySelectorAll<HTMLButtonElement>('.rlc-ev-trove-rolls button')].find((b) => b.textContent === n)!;
  expect(roll('Girar 1x').disabled).toBe(false);
  expect(roll('Girar 10x').disabled).toBe(true);
});

test('Reinos: girar pede confirmação, manda o giro v2 com a oferta da loja e mostra o que saiu', async () => {
  routes['/lol-tft-troves/v1/banners'] = [{ id: 'b1', name: 'Reino Ativo', backgroundTexture: '/b1.png', thumbnailTexture: '', startDate: iso(-DAY), endDate: iso(2 * DAY), pullCost: 50, storeId: 's1', catalogEntryId: 'c1', paymentOptionsKeys: ['0-TFT_TREASURE_TROVE_TOKEN'] }];
  routes['/lol-inventory/v1/wallet/0'] = { TFT_TREASURE_TROVE_TOKEN: 100 };
  routes['/lol-tft-troves/v1/roll-rewards'] = [{ name: 'Pequena Lenda Fulana', iconPath: '/r/1.png' }];
  await mount();
  act(() => tab('Reinos dos Tesouros').click());
  act(() => [...root.querySelectorAll<HTMLButtonElement>('.rlc-ev-trove-rolls button')][0]!.click());
  expect(root.querySelector('.rlc-veil')!.textContent).toContain('Gastar 50 Fichas do Tesouro em Reino Ativo?');
  // Nada é enviado antes de confirmar.
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/roll'))).toBe(false);
  act(() => [...root.querySelectorAll<HTMLButtonElement>('.rlc-veil button')].find((b) => b.textContent === 'Girar 1x')!.click());
  for (let i = 0; i < 4; i++) await settle();
  const post = fetchMock.mock.calls.find((c) => c[0] === '/lol-tft-troves/v2/roll')!;
  expect(JSON.parse(post[1].body)).toEqual({ storeId: 's1', catalogEntryId: 'c1', paymentOptionsKeys: ['0-TFT_TREASURE_TROVE_TOKEN'], quantity: 1 });
  expect(root.querySelector('.rlc-ev-trove-got')!.textContent).toContain('Pequena Lenda Fulana');
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-tft-troves/v1/roll-rewards' && c[1]?.method === 'DELETE')).toBe(true);
});

test('pendingClaims soma o pendente dos eventos ativos e do TFT', async () => {
  routes['/lol-tft-pass/v1/active-passes'] = [TFT];
  expect(await pendingClaims(fakeLcu())).toBe(3);
});

test('sem nada ativo mostra o estado vazio', async () => {
  routes = {};
  await mount();
  expect(root.textContent).toContain('Nenhum evento ativo');
});

test('ARAM Caos: missões de outra categoria com o nome do evento entram num grupo dele; expiradas ficam de fora', () => {
  const now = Date.now();
  const mission = (title: string, over: Record<string, unknown> = {}) => ({ title, description: '', status: 'PENDING', startTime: now - DAY, endTime: now + DAY, objectives: [{ description: '(DNT) Desbloqueie um Aumento', progress: { currentProgress: 0, totalCount: 1 } }], rewards: [{ description: '300 BXP' }], ...over });
  const cats = [
    { id: 'caos', objectives: [{ localizedTitle: ['Diária'], missions: [mission(''), mission('Velha', { endTime: now - 1 })] }] },
    { id: 'temporada', objectives: [{ localizedTitle: ['Eventos'], missions: [mission('Rumo ao Estrelato (1 de 2)'), mission('Outra coisa')] }] },
  ];
  const cards = missionCards(cats, 'caos', now, 'Rumo ao Estrelato');
  expect(cards.map((c) => [c.group, c.title])).toEqual([['Diária', ''], ['Rumo ao Estrelato', 'Rumo ao Estrelato (1 de 2)']]);
  expect(cards[1]!.lines[0]!.text).toBe('Desbloqueie um Aumento');
});

test('passe: contagem a resgatar da trilha vence a do eventInfo; moeda da trilha com ícone no lugar de XP', async () => {
  routes[`/lol-event-hub/v1/events/${EV}/reward-track/unclaimed-rewards`] = { rewardsCount: 0 };
  routes[`/lol-event-hub/v1/events/${EV}/info`] = { battleExpIcon: '/i/fama.svg' };
  await mount();
  // O eventInfo diz 2; a trilha diz 0 e só a recompensa pronta conta.
  expect(root.textContent).toContain('1 para resgatar');
  expect(root.querySelector('.rlc-ev-xpnum img')!.getAttribute('src')).toBe('/i/fama.svg');
  expect(eventPass(event(), ITEMS, null, null, undefined, { unclaimed: 0 }).unclaimed).toBe(0);
  expect(eventPass(event(), ITEMS, null, null).unclaimed).toBe(2);
});

test('Reinos: client só com o giro v1 usa a oferta e a tabela do banner; sem nenhum giro, banner só para consulta', async () => {
  const { endpoints } = await import('../../lcu/capabilities');
  routes['/lol-tft-troves/v1/banners'] = [{ id: 'b1', name: 'Reino', backgroundTexture: '/b1.png', thumbnailTexture: '', startDate: iso(-DAY), endDate: iso(2 * DAY), pullCost: 50, storeId: 's1', catalogEntryId: 'c1', rollOffer: 'o1', status: { dropTableId: 'd1' } }];
  routes['/lol-inventory/v1/wallet/0'] = { TFT_TREASURE_TROVE_TOKEN: 100 };
  endpoints.value = new Set(['PostLolTftTrovesV1Roll']);
  try {
    await mount();
    act(() => tab('Reinos dos Tesouros').click());
    act(() => root.querySelector<HTMLButtonElement>('.rlc-ev-trove-rolls button')!.click());
    act(() => [...root.querySelectorAll<HTMLButtonElement>('.rlc-veil button')].find((b) => b.textContent === 'Girar 1x')!.click());
    await settle();
    const post = fetchMock.mock.calls.find((c) => c[0] === '/lol-tft-troves/v1/roll')!;
    expect(JSON.parse(post[1].body)).toEqual({ offerId: 'o1', numberOfRolls: 1, dropTableId: 'd1' });
    render(null, root);
    endpoints.value = new Set();
    await mount();
    act(() => tab('Reinos dos Tesouros').click());
    expect(root.querySelector('.rlc-ev-trove-rolls')).toBeNull();
  } finally {
    endpoints.value = null;
  }
});

test('Loja de Cristais: aba só com Cristais na carteira; comprar pede confirmação e relê a loja', async () => {
  const shop = { data: [{ id: 's1', name: 'Sazonal', startTime: iso(-DAY), endTime: iso(3 * DAY), catalogEntries: [{ id: 'a', name: 'Chibi Fulana', displayMetadata: { tft: { pc: 'ASSETS/a.png' } }, purchaseUnits: [{ fulfillment: { ownedQuantity: 0, maxQuantity: 1 }, paymentOptions: [{ key: '0-tft_standard_coin', payments: [{ currencyId: 'db40bd66-f3ac-5bca-a104-2eebca8cc1d2', finalDelta: 3000 }] }] }] }] }] };
  routes['/lol-inventory/v1/wallet/0'] = { tft_standard_coin: 3650 };
  routes['/lol-marketplace/v1/products/tft/stores'] = shop;
  await mount();
  act(() => tab('Loja de Cristais').click());
  await settle();
  expect(root.querySelector('.rlc-rs-head h3')!.textContent).toBe('Sazonal');
  expect(root.querySelector('.rlc-rs-item .rlc-rs-cost')!.textContent).toBe('3.000');
  act(() => root.querySelector<HTMLButtonElement>('.rlc-rs-item button')!.click());
  expect(root.querySelector('.rlc-veil')!.textContent).toContain('Comprar Chibi Fulana por 3.000 Cristais do Reino?');
  expect(fetchMock.mock.calls.some((c) => c[0] === '/lol-marketplace/v1/products/tft/purchases')).toBe(false);
  render(null, root);
  routes['/lol-inventory/v1/wallet/0'] = { RP: 5 };
  await mount();
  expect(tabs()).not.toContain('Loja de Cristais');
});

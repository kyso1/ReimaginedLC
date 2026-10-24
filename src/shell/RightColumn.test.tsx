import { readFileSync } from 'node:fs';
import { signal } from '@preact/signals';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import type { Lcu } from '../lcu';
import { fakeLcu, friend, ready } from '../test/fixtures';
import { DEFAULT_PREFS, prefs } from './prefs';
import { RightColumn } from './RightColumn';
import { Wallet } from './Wallet';

let root: HTMLElement;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  render(null, root);
  root.remove();
  delete window.DataStore;
  vi.unstubAllGlobals();
  prefs.value = DEFAULT_PREFS;
});

const withValues = (values: Partial<Record<keyof Lcu, unknown>>) => {
  const lcu = fakeLcu();
  for (const [k, v] of Object.entries(values)) (lcu[k as keyof Lcu] as { value: unknown }).value = v;
  return lcu;
};
const me = { gameName: 'Fulano', gameTag: 'TAG', icon: 29, availability: 'chat', statusMessage: 'oi', lol: { level: '312' } };
function fakeStore(initial: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(initial));
  window.DataStore = { has: (k) => data.has(k), get: (k) => data.get(k), set: (k, v) => void data.set(k, v), remove: (k) => void data.delete(k) };
  return data;
}
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const titles = () => [...root.querySelectorAll('.rlc-rc-group-title')].map((g) => g.textContent!.replace(/\s+/g, ' ').trim());
const names = () => [...root.querySelectorAll('.rlc-rc-fname')].map((n) => n.textContent);
const hover = (type: 'mouseenter' | 'mouseleave', sel = '.rlc-rc-friend') => act(() => void root.querySelector(sel)!.dispatchEvent(new MouseEvent(type)));
const noop = () => {};

test('recolhida: meu ícone e só os amigos que não estão offline, jogando primeiro', () => {
  const lcu = withValues({
    chatMe: ready(me),
    friends: ready([
      friend({ gameName: 'Ausente', availability: 'away' }),
      friend({ gameName: 'Off', availability: 'offline' }),
      friend({ gameName: 'Jogando', availability: 'dnd', lol: { gameStatus: 'inGame' } as never }),
      friend({ gameName: 'Online', availability: 'chat' }),
    ]),
  });
  act(() => render(<RightColumn lcu={lcu} open={false} onOpen={noop} onClose={noop} />, root));
  expect(root.querySelector('.rlc-rc-me img')!.getAttribute('src')).toBe('/lol-game-data/assets/v1/profile-icons/29.jpg');
  expect([...root.querySelectorAll('.rlc-rc-list .rlc-rc-avatar')].map((a) => a.getAttribute('aria-label'))).toEqual(['Jogando', 'Online', 'Ausente']);
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-open')).toBeNull();
});

test('meu ícone, adicionar amigo e chat são os mesmos elementos aberta e fechada; avatares na mesma célula', () => {
  const lcu = withValues({ chatMe: ready(me), friends: ready([friend({ gameName: 'Online', availability: 'chat' })]) });
  act(() => render(<RightColumn lcu={lcu} open={false} onOpen={noop} onClose={noop} onChat={noop} />, root));
  const fixed = ['.rlc-rc-me', '.rlc-rc-tool', '.rlc-rc-chatbtn'].map((s) => root.querySelector(s));
  expect(root.querySelector('.rlc-rc-list .rlc-rc-avatar')!.classList.contains('rlc-rc-cell')).toBe(true);
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} onChat={noop} />, root));
  expect(['.rlc-rc-me', '.rlc-rc-tool', '.rlc-rc-chatbtn'].map((s) => root.querySelector(s))).toEqual(fixed);
  expect(root.querySelector('.rlc-rc-friend .rlc-rc-avatar')!.classList.contains('rlc-rc-cell')).toBe(true);
});

test('expandida: pastas do client com online/total, offline na pasta Offline e o que cada um está fazendo', () => {
  const lcu = withValues({
    chatMe: ready(me),
    queues: ready([{ id: 420, name: 'Ranqueada Solo/Duo' }]),
    friendGroups: ready([{ id: 0, name: '**Default', priority: 4 }, { id: 1, name: 'mamae', priority: 5 }, { id: 2, name: 'vazia', priority: 1 }]),
    friends: ready([
      friend({ gameName: 'Jogando', availability: 'dnd', groupId: 0, lol: { gameStatus: 'inGame', gameQueueType: 'RANKED_SOLO_5x5', queueId: '420' } as never }),
      friend({ gameName: 'Off', availability: 'offline', groupId: 0 }),
      friend({ gameName: 'Cel', availability: 'mobile', groupId: 0 }),
      friend({ gameName: 'Disc', availability: 'offline', groupId: 0, discordOnlineStatus: 'online' } as never),
      friend({ gameName: 'Mae', availability: 'offline', groupId: 1 }),
    ]),
  });
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  expect(root.querySelector('.rlc-rc-name')!.textContent).toBe('Fulano#TAG');
  expect(titles()).toEqual(['mamae 0/1', 'Geral 1/4', 'Offline 2']);
  // Pasta com alguém para jogar abre sozinha; Offline começa fechada.
  expect(names()).toEqual(['Jogando', 'Cel', 'Disc']);
  expect([...root.querySelectorAll('.rlc-rc-friend-main small')].map((s) => s.textContent)).toEqual(['Em jogo · Ranqueada Solo/Duo', 'No celular', 'Online no Discord']);
});

test('busca filtra em todas as pastas e abre as que têm resultado', () => {
  const lcu = withValues({
    chatMe: ready(me),
    friendGroups: ready([{ id: 0, name: '**Default', priority: 4 }, { id: 1, name: 'mamae', priority: 5 }]),
    friends: ready([friend({ gameName: 'Zeca', availability: 'chat', groupId: 1 }), friend({ gameName: 'Zeferino', availability: 'offline', groupId: 0 }), friend({ gameName: 'Ana', availability: 'offline', groupId: 0 })]),
  });
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  const search = root.querySelector<HTMLInputElement>('.rlc-rc-search')!;
  act(() => {
    search.value = 'ze';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(names()).toEqual(['Zeca', 'Zeferino']);
});

test('pastas abertas e fechadas à mão ficam guardadas entre aberturas', () => {
  const store = fakeStore();
  const lcu = withValues({
    chatMe: ready(me),
    friendGroups: ready([{ id: 0, name: '**Default', priority: 4 }]),
    friends: ready([friend({ gameName: 'Online', availability: 'chat', groupId: 0 }), friend({ gameName: 'Off', availability: 'offline', groupId: 0 })]),
  });
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  const [geral, offline] = root.querySelectorAll<HTMLButtonElement>('.rlc-rc-group-title');
  act(() => geral!.click());
  act(() => offline!.click());
  expect(names()).toEqual(['Off']);
  expect(store.get('rlc.friendFolders')).toEqual({ '0': false, offline: true });
  // Client reaberto: a gaveta monta de novo e lê o que ficou guardado.
  render(null, root);
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  expect(names()).toEqual(['Off']);
  expect(root.querySelector('.rlc-rc-group-title')!.getAttribute('aria-expanded')).toBe('false');
});

test('passar o mouse abre e sair fecha; com o chat aberto a gaveta não abre', () => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  act(() => render(<RightColumn lcu={withValues({ chatMe: ready(me) })} open={false} onOpen={onOpen} onClose={onClose} />, root));
  hover('mouseenter', '.rlc-rc');
  expect(onOpen).toHaveBeenCalledOnce();
  hover('mouseleave', '.rlc-rc');
  expect(onClose).toHaveBeenCalledOnce();
  act(() => render(<RightColumn lcu={withValues({ chatMe: ready(me) })} open onOpen={onOpen} onClose={onClose} chatOpen onChat={noop} />, root));
  hover('mouseenter', '.rlc-rc');
  expect(onOpen).toHaveBeenCalledOnce();
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-open')).toBeNull();
});

test('na seleção de campeões a gaveta não abre; o botão de chat continua', () => {
  const onOpen = vi.fn();
  const onChat = vi.fn();
  const lcu = withValues({ chatMe: ready(me), gameflowPhase: ready('ChampSelect') });
  act(() => render(<RightColumn lcu={lcu} open onOpen={onOpen} onClose={noop} onChat={onChat} />, root));
  hover('mouseenter', '.rlc-rc');
  expect(onOpen).not.toHaveBeenCalled();
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-open')).toBeNull();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-rc-chatbtn')!.click());
  expect(onChat).toHaveBeenCalledOnce();
});

test('gaveta aberta: textos alinhados à esquerda, ⋯ depois do nome e a célula do avatar por último', () => {
  const css = readFileSync('src/ui/css/social.css', 'utf8');
  expect(css).not.toMatch(/\.rlc-rc[^{]*\{[^}]*text-align: right/);
  expect(css).toMatch(/\.rlc-rc-label \{[^}]*text-align: left/);
  const lcu = withValues({ chatMe: ready(me), friends: ready([friend({ gameName: 'Online', availability: 'chat' })]) });
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} menuFor={() => <button class="rlc-col-menu" />} />, root));
  const label = root.querySelector('.rlc-rc-friend .rlc-rc-label')!;
  expect([...label.children].map((c) => c.className)).toEqual(['rlc-rc-friend-main', 'rlc-col-menu']);
  expect(root.querySelector('.rlc-rc-friend')!.lastElementChild!.classList.contains('rlc-rc-cell')).toBe(true);
});

test('clicar no meu ícone ou no meu nome abre o perfil', () => {
  const onProfile = vi.fn();
  act(() => render(<RightColumn lcu={withValues({ chatMe: ready(me) })} open onOpen={noop} onClose={noop} onProfile={onProfile} />, root));
  act(() => root.querySelector<HTMLButtonElement>('.rlc-rc-me')!.click());
  act(() => root.querySelector<HTMLButtonElement>('.rlc-rc-name')!.click());
  expect(onProfile).toHaveBeenCalledTimes(2);
});

test('cartão ao passar o mouse num amigo em partida: Riot ID, mensagem, fila, campeão, tempo e elo', async () => {
  const ranked = { queueMap: { RANKED_SOLO_5x5: { tier: 'GOLD', division: 'II', leaguePoints: 40 } } };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('/lol-ranked/v1/ranked-stats/') ? new Response(JSON.stringify(ranked), { status: 200 }) : new Response(null, { status: 404 }))));
  const lcu = withValues({
    chatMe: ready(me),
    queues: ready([{ id: 420, name: 'Ranqueada Solo/Duo' }]),
    friendGroups: ready([{ id: 0, name: '**Default', priority: 4 }]),
    friends: ready([
      friend({
        id: 'z@pvp', gameName: 'Zeca', gameTag: 'BR1', groupId: 0, availability: 'dnd', statusMessage: 'só mid',
        lol: { gameStatus: 'inGame', queueId: '420', championId: '103', timeStamp: String(Date.now() - 754_000), level: '408' } as never,
      }),
    ]),
  });
  lcu.game = { ...lcu.game, champions: async () => new Map([[103, { id: 103, name: 'Ahri', icon: '/ahri.png', roles: [] }]]) };
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  hover('mouseenter');
  await settle();
  await settle();
  const card = root.querySelector('.rlc-fcard')!;
  expect(card.textContent).toContain('Zeca#BR1');
  expect(card.textContent).toContain('só mid');
  expect(card.querySelector('.rlc-fcard-state')!.textContent).toBe('Em jogoRanqueada Solo/Duo');
  expect(card.querySelector('.rlc-fcard-game')!.textContent).toContain('Ahri');
  expect(card.querySelector('.rlc-fcard-game img')!.getAttribute('src')).toBe('/ahri.png');
  expect(card.querySelector('time')!.textContent).toBe('12:34');
  expect(card.querySelector('.rlc-rank')!.textContent).toContain('Ouro II 40');
  hover('mouseleave');
  expect(root.querySelector('.rlc-fcard')).toBeNull();
});

test('cartão de amigo offline mostra quando foi visto por último e o elo solo/duo da presença', () => {
  fakeStore({ 'rlc.friendFolders': { offline: true } });
  const lcu = withValues({
    chatMe: ready(me),
    friendGroups: ready([{ id: 0, name: '**Default', priority: 4 }]),
    friends: ready([friend({ gameName: 'Sumido', groupId: 0, availability: 'offline', lastSeenOnlineTimestamp: String(Date.now() - 3 * 3600_000), lol: { rankedLeagueTier: 'PLATINUM', rankedLeagueDivision: 'IV' } as never })]),
  });
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  hover('mouseenter');
  const card = root.querySelector('.rlc-fcard')!;
  expect(card.querySelector('.rlc-fcard-state')!.textContent).toBe('Offline');
  expect(card.querySelector('.rlc-fcard-seen')!.textContent).toBe('Visto por último há 3 horas');
  expect(card.querySelector('.rlc-rank')!.textContent).toBe('Solo/Duo • Platina IV');
});

test('carteira: só as moedas pedidas, formatadas e com ícone; ausentes não aparecem', () => {
  const lcu = withValues({ wallet: ready({ lol_blue_essence: 12450, RP: 1380 }), orangeEssence: ready({ count: 320 }) });
  act(() => render(<Wallet lcu={lcu} show={['be', 'rp']} />, root));
  expect([...root.querySelectorAll('.rlc-cur')].map((c) => c.textContent)).toEqual(['12.450', '1.380']);
  expect(root.querySelector('.rlc-cur img')!.getAttribute('src')).toContain('icon-be');
  render(null, root);
  act(() => render(<Wallet lcu={lcu} show={['oe']} />, root));
  expect([...root.querySelectorAll('.rlc-cur')].map((c) => c.textContent)).toEqual(['320']);
  render(null, root);
  act(() => render(<Wallet lcu={withValues({ wallet: ready(null), orangeEssence: ready(null) })} show={['be', 'rp', 'oe']} />, root));
  expect(root.querySelector('.rlc-cur')).toBeNull();
});

test('fixada: aberta sem passar o mouse, também com o chat aberto, e passar o mouse não pede para abrir', () => {
  prefs.value = { ...DEFAULT_PREFS, socialPinned: true };
  const onOpen = vi.fn();
  const lcu = withValues({ chatMe: ready(me), friends: ready([friend({ gameName: 'Online', availability: 'chat' })]) });
  act(() => render(<RightColumn lcu={lcu} open={false} onOpen={onOpen} onClose={noop} chatOpen onChat={noop} />, root));
  const rc = root.querySelector('.rlc-rc')!;
  expect(rc.getAttribute('data-open')).toBe('true');
  expect(rc.getAttribute('data-pinned')).toBe('true');
  expect(names()).toEqual(['Online']);
  hover('mouseenter', '.rlc-rc');
  expect(onOpen).not.toHaveBeenCalled();
});

test('fixada: recolhe na seleção de campeões (sem abrir no hover) e volta aberta depois', () => {
  prefs.value = { ...DEFAULT_PREFS, socialPinned: true };
  const phase = signal(ready('ChampSelect')) as Lcu['gameflowPhase'];
  const lcu = fakeLcu({ gameflowPhase: phase });
  lcu.chatMe.value = ready(me) as never;
  const onOpen = vi.fn();
  act(() => render(<RightColumn lcu={lcu} open={false} onOpen={onOpen} onClose={noop} onChat={noop} />, root));
  const rc = () => root.querySelector('.rlc-rc')!;
  expect(rc().getAttribute('data-open')).toBeNull();
  expect(rc().getAttribute('data-pinned')).toBeNull();
  hover('mouseenter', '.rlc-rc');
  expect(onOpen).not.toHaveBeenCalled();
  expect(root.querySelector('.rlc-rc-chatbtn')).not.toBeNull();
  act(() => void (phase.value = ready('InProgress')));
  expect(rc().getAttribute('data-open')).toBe('true');
  expect(rc().getAttribute('data-pinned')).toBe('true');
});

test('alfinete no cabeçalho liga e desliga a gaveta fixa na hora e guarda a preferência', () => {
  const store = fakeStore();
  act(() => render(<RightColumn lcu={withValues({ chatMe: ready(me) })} open onOpen={noop} onClose={noop} />, root));
  const pin = () => root.querySelector<HTMLButtonElement>('.rlc-rc-me-row .rlc-rc-pin')!;
  expect(pin().getAttribute('aria-pressed')).toBe('false');
  expect(pin().getAttribute('aria-label')).toBe('Fixar a lista de amigos aberta');
  act(() => pin().click());
  expect(prefs.value.socialPinned).toBe(true);
  expect((store.get('rlc.prefs') as { socialPinned: boolean }).socialPinned).toBe(true);
  expect(pin().getAttribute('aria-pressed')).toBe('true');
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-pinned')).toBe('true');
  act(() => pin().click());
  expect(prefs.value.socialPinned).toBe(false);
  expect(root.querySelector('.rlc-rc')!.getAttribute('data-pinned')).toBeNull();
});

test('a largura reservada à faixa vem de --rlc-social-w: 56 px solta, 300 px fixa; pílula e chat andam junto', () => {
  const css = readFileSync('src/ui/css/social.css', 'utf8');
  expect(css).toMatch(/\.rlc-app \{ --rlc-social-w: 56px; \}/);
  expect(css).toMatch(/\.rlc-app\[data-social='pinned'\] \{ --rlc-social-w: 300px; \}/);
  expect(css).toMatch(/\.rlc-rc \{[^}]*width: var\(--rlc-social-w\)/);
  expect(css).toMatch(/\.rlc-qpill \{ right: calc\(var\(--rlc-social-w\)/);
  expect(css).toMatch(/\.rlc-chat-dock \{ right: calc\(var\(--rlc-social-w\)/);
});

test('cabeçalho aberto usa a splash do fundo do meu perfil e troca quando o fundo muda', async () => {
  class Img { src = ''; decode = async () => {}; }
  vi.stubGlobal('Image', Img);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url === '/lol-summoner/v1/current-summoner/summoner-profile' ? new Response(JSON.stringify({ backgroundSkinId: 40067 }), { status: 200 }) : new Response(null, { status: 404 }))));
  let emit: (uri: string, t: string, d: unknown) => void = () => {};
  const lcu = withValues({ chatMe: ready(me) });
  lcu.game = { ...lcu.game, splash: async (id?: number) => `/splash/${id ?? 'padrao'}.jpg` };
  lcu.events = { onPrefix: (_p, fn) => ((emit = fn), () => {}) };
  act(() => render(<RightColumn lcu={lcu} open={false} onOpen={noop} onClose={noop} />, root));
  await settle();
  expect(root.querySelector('.rlc-rc-banner')).toBeNull();
  act(() => render(<RightColumn lcu={lcu} open onOpen={noop} onClose={noop} />, root));
  for (let i = 0; i < 6; i++) await settle();
  const banner = () => root.querySelector<HTMLElement>('.rlc-rc-me-row .rlc-rc-banner')?.style.backgroundImage;
  expect(banner()).toBe('url("/splash/40067.jpg")');
  act(() => emit('/lol-summoner/v1/current-summoner/summoner-profile', 'Update', { backgroundSkinId: 266001 }));
  for (let i = 0; i < 6; i++) await settle();
  expect(banner()).toBe('url("/splash/266001.jpg")');
});

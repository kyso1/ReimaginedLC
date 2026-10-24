import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { SkinCarousel } from '../screens/champselect/Loadout';
import { cell } from '../test/fixtures';
import { chooseRoseChroma, chooseRoseSkin, roseChoice, roseMods, roseStatus, selectRoseMod, startRose, stopRose } from './rose';

/** WebSocket falso: guarda o que foi enviado e deixa o teste mandar mensagens do "ROSE". */
class FakeSocket {
  static OPEN = 1;
  static last: FakeSocket | null = null;
  readyState = 0;
  sent: Array<Record<string, unknown>> = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(public url: string) {
    FakeSocket.last = this;
  }
  send(text: string) {
    this.sent.push(JSON.parse(text));
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  emit(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

let fetchMock: ReturnType<typeof vi.fn>;
/** ROSE rodando na porta 50003 (como `/bridge-port` responde); `null`: ninguém escuta. */
function roseAt(port: number | null) {
  fetchMock = vi.fn(async (url: string) => {
    if (port !== null && url === `http://127.0.0.1:${port}/bridge-port`) return new Response(String(port));
    if (typeof url === 'string' && url.startsWith('http://127.0.0.1:')) throw new TypeError('Failed to fetch');
    return new Response(null, { status: 204 });
  });
  vi.stubGlobal('fetch', fetchMock);
}
const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

async function connected() {
  roseAt(50003);
  startRose();
  await flush();
  act(() => FakeSocket.last!.open());
  return FakeSocket.last!;
}

let root: HTMLElement;
beforeEach(() => {
  setLocale('pt_BR');
  localStorage.clear();
  FakeSocket.last = null;
  roseChoice.value = null;
  roseMods.value = null;
  vi.stubGlobal('WebSocket', FakeSocket);
  root = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  render(null, root);
  root.remove();
  stopRose();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('ROSE ausente: fica "absent", não abre socket e tenta de novo com recuo', async () => {
  vi.useFakeTimers();
  roseAt(null);
  startRose();
  await vi.advanceTimersByTimeAsync(0);
  expect(roseStatus.value).toBe('absent');
  expect(FakeSocket.last).toBeNull();
  const scans = fetchMock.mock.calls.length;
  expect(scans).toBe(100); // a porta guardada (50000) e as outras 99
  chooseRoseSkin('Ahri Arcana'); // sem conexão, não quebra
  await vi.advanceTimersByTimeAsync(1000);
  expect(fetchMock.mock.calls.length).toBe(scans * 2);
  await vi.advanceTimersByTimeAsync(1000); // o recuo dobrou: ainda não
  expect(fetchMock.mock.calls.length).toBe(scans * 2);
  await vi.advanceTimersByTimeAsync(1000);
  expect(fetchMock.mock.calls.length).toBe(scans * 3);
});

test('acha a porta, conecta e manda a escolha no formato dos plugins do ROSE; reenvia ao travar', async () => {
  const ws = await connected();
  expect(ws.url).toBe('ws://127.0.0.1:50003');
  expect(roseStatus.value).toBe('connected');
  expect(localStorage.getItem('rose_bridge_port')).toBe('50003');

  chooseRoseSkin('Ahri Arcana');
  expect(ws.sent[0]).toMatchObject({ skin: 'Ahri Arcana', originalName: 'Ahri Arcana' });
  chooseRoseChroma('Ahri Arcana', { id: 103087, name: 'Rubi', championId: 103, baseSkinId: 103086 });
  expect(ws.sent[1]).toMatchObject({ type: 'chroma-selection', skinId: 103087, chromaId: 103087, chromaName: 'Rubi', championId: 103, baseSkinId: 103086 });

  ws.sent = [];
  act(() => ws.emit({ type: 'champion-locked', locked: true }));
  expect(ws.sent.map((m) => m.type ?? m.skin)).toEqual(['Ahri Arcana', 'chroma-selection']);
});

test('mods da skin: só os feitos para ela; escolher e desfazer mandam select-skin-mod', async () => {
  const ws = await connected();
  act(() =>
    ws.emit({
      type: 'skin-mods-response',
      championId: 103,
      skinId: 103086,
      mods: [
        { modName: 'Ahri Neon', displayName: '', relativePath: 'skins/103/neon', availableForRequestedSkin: true, thumbnailUrl: 'http://127.0.0.1:50003/mod-asset/neon.png' },
        { modName: 'Outra', relativePath: 'skins/103/outra', availableForRequestedSkin: false },
      ],
    }),
  );
  expect(roseMods.value?.mods.map((m) => m.name)).toEqual(['Ahri Neon']);
  const mod = roseMods.value!.mods[0]!;
  selectRoseMod(103, 103086, mod);
  expect(ws.sent.at(-1)).toMatchObject({ type: 'select-skin-mod', championId: 103, skinId: 103086, modId: 'skins/103/neon', modData: mod.raw });
  selectRoseMod(103, 103086, null);
  expect(ws.sent.at(-1)).toMatchObject({ type: 'select-skin-mod', modId: null });
});

const skin = (id: number, over: Record<string, unknown> = {}) => ({ id, name: `Skin ${id}`, unlocked: true, disabled: false, isBase: false, tilePath: `/t/${id}.jpg`, childSkins: [], ...over }) as never;
const SKINS = [skin(103000, { isBase: true }), skin(103086, { unlocked: false, childSkins: [{ id: 103087, name: 'Rubi', unlocked: false, colors: ['#f00'] }] })];
const me = cell({ cellId: 0, championId: 103, selectedSkinId: 103000 });

test('carrossel sem ROSE: só as possuídas', () => {
  act(() => render(<SkinCarousel skins={SKINS} me={me} />, root));
  expect([...root.querySelectorAll('.rlc-cs-skin')].map((b) => b.getAttribute('aria-label'))).toEqual(['Skin 103000']);
});

test('carrossel com ROSE: skin não possuída com selo; escolher vai só para o ROSE, nunca para a LCU', async () => {
  const ws = await connected();
  const onPick = vi.fn();
  act(() => render(<SkinCarousel skins={SKINS} me={me} rose onPick={onPick} />, root));
  const tile = root.querySelector<HTMLButtonElement>('.rlc-cs-skin[aria-label="Skin 103086"]')!;
  expect(tile.querySelector('.rlc-cs-rose-badge')!.textContent).toBe('ROSE');
  act(() => tile.click());
  expect(onPick).toHaveBeenCalledWith(103086);
  expect(ws.sent).toContainEqual(expect.objectContaining({ skin: 'Skin 103086' }));
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('my-selection'))).toBe(false);

  // Com a skin do ROSE no palco: cromas não possuídas e os mods aparecem.
  act(() => render(<SkinCarousel skins={SKINS} me={me} rose pick={103086} onPick={onPick} />, root));
  expect(ws.sent).toContainEqual({ type: 'request-skin-mods', championId: 103, skinId: 103086 });
  act(() => root.querySelector<HTMLButtonElement>('.rlc-cs-chroma[aria-label="Rubi"]')!.click());
  expect(ws.sent).toContainEqual(expect.objectContaining({ type: 'chroma-selection', chromaId: 103087, baseSkinId: 103086 }));
  expect(ws.sent).toContainEqual({ type: 'request-skin-mods', championId: 103, skinId: 103087 });
  act(() => ws.emit({ type: 'skin-mods-response', championId: 103, skinId: 103087, mods: [{ modName: 'Neon', relativePath: 'm/neon', availableForRequestedSkin: true }] }));
  const modTile = root.querySelector<HTMLButtonElement>('.rlc-cs-mod')!;
  expect(modTile.getAttribute('aria-label')).toBe('Neon');
  act(() => modTile.click());
  expect(ws.sent.at(-1)).toMatchObject({ type: 'select-skin-mod', skinId: 103087, modId: 'm/neon' });
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('my-selection'))).toBe(false);
});

test('na seleção: skin do ROSE vai para o palco (Crossfade) e para o espelho que o ROSE-SkinMonitor lê', async () => {
  const { ChampSelect } = await import('../screens/champselect/ChampSelect');
  const { action, fakeLcu, ready, session } = await import('../test/fixtures');
  const { setPrefs } = await import('../shell/prefs');
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null;
      decode = () => Promise.resolve();
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
  setPrefs({ rose: true });
  const ws = await connected();
  const lcu = fakeLcu();
  lcu.game = { ...lcu.game, splash: async (id) => (id ? `/splash/${id}.jpg` : null) };
  lcu.skins.value = ready(SKINS);
  lcu.champSelect.value = ready(session({ myTeam: [cell({ cellId: 0, championId: 103, selectedSkinId: 103000 })], actions: [[action({ id: 6, type: 'pick', completed: true, championId: 103 })]] }));
  act(() => render(<ChampSelect lcu={lcu} />, root));
  await flush();
  act(() => root.querySelector<HTMLButtonElement>('.rlc-cs-skin[aria-label="Skin 103086"]')!.click());
  for (let i = 0; i < 4; i++) await flush();
  expect(root.querySelector<HTMLElement>('.rlc-cs-splash .rlc-xfade-layer:last-child')!.style.backgroundImage).toContain('/splash/103086.jpg');
  expect(root.querySelector('.skin-name-text')!.textContent).toBe('Skin 103086');
  expect(ws.sent).toContainEqual(expect.objectContaining({ skin: 'Skin 103086' }));
  setPrefs({ rose: false });
});

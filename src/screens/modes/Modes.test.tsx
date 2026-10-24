import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { queue } from '../../test/fixtures';
import { Modes } from './Modes';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
const store = new Map<string, unknown>();
beforeEach(() => {
  setLocale('pt_BR');
  store.clear();
  window.DataStore = { has: (k) => store.has(k), get: (k) => store.get(k), set: (k, v) => void store.set(k, v), remove: (k) => void store.delete(k) };
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  delete window.DataStore;
});

const QUEUES = [
  queue({ id: 400, name: 'Normal (escolha)' }),
  queue({ id: 420, name: 'Ranqueada Solo/Duo' }),
  queue({ id: 450, name: 'ARAM', gameSelectModeGroup: 'kARAM' }),
];
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const btn = (text: string) => [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
const mount = (props: Partial<Parameters<typeof Modes>[0]> = {}) => {
  const onClose = vi.fn();
  const onCustom = vi.fn();
  act(() => render(<Modes queues={QUEUES} current={420} onClose={onClose} onCustom={onCustom} {...props} />, root));
  return { onClose, onCustom };
};

test('um cartão por grupo mais Personalizada; grupo e fila atuais vêm selecionados', () => {
  mount();
  const cards = [...root.querySelectorAll('.rlc-mode-card')].map((c) => c.querySelector('.rlc-mode-name')!.textContent);
  expect(cards).toEqual(["Summoner's Rift", 'ARAM', 'Personalizada']);
  expect(btn("Summoner's Rift").getAttribute('aria-pressed')).toBe('true');
  expect(btn('Ranqueada Solo/Duo').getAttribute('aria-pressed')).toBe('true');
});

test('trocar de grupo mostra as filas dele', () => {
  mount();
  act(() => btn('ARAM').click());
  const chips = [...root.querySelectorAll('.rlc-queue-chip')].map((c) => c.textContent);
  expect(chips).toEqual(['ARAM']);
});

test('confirmar cria o lobby, grava a última fila e fecha', async () => {
  const { onClose } = mount();
  act(() => btn('Normal (escolha)').click());
  act(() => btn('Confirmar').click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-lobby/v2/lobby', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"queueId":400}' });
  await settle();
  expect(store.get('rlc.lastQueue')).toBe(400);
  expect(onClose).toHaveBeenCalledOnce();
});

test('erro ao criar o lobby não fecha nem grava', async () => {
  fetchMock.mockResolvedValue(new Response('{"message":"x"}', { status: 400 }));
  window.Toast = { success: vi.fn(), error: vi.fn() };
  const { onClose } = mount();
  act(() => btn('Confirmar').click());
  await settle();
  expect(onClose).not.toHaveBeenCalled();
  expect(store.has('rlc.lastQueue')).toBe(false);
  delete window.Toast;
});

test('sem fila selecionada, Confirmar fica desabilitado', () => {
  mount({ current: null });
  expect(btn('Confirmar').disabled).toBe(true);
});

test('Personalizada chama onCustom; Voltar e Escape chamam onClose', () => {
  const { onClose, onCustom } = mount();
  act(() => btn('Personalizada').click());
  expect(onCustom).toHaveBeenCalledOnce();
  act(() => btn('Voltar').click());
  act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(onClose).toHaveBeenCalledTimes(2);
});

test('sem filas mostra carregando e só Personalizada', () => {
  mount({ queues: [], current: null });
  expect(root.textContent).toContain('Carregando filas');
  expect([...root.querySelectorAll('.rlc-mode-card')].map((c) => c.textContent)).toEqual(['Personalizada']);
});

test('fila personalizada (Ferramenta de Treino) cria o lobby com o corpo de sala', () => {
  mount({ queues: [queue({ id: 3140, name: 'Treino', isCustom: true, gameMode: 'PRACTICETOOL', gameSelectCategory: 'kTraining', gameTypeConfig: { id: 19 } as never })], current: 3140 });
  act(() => btn('Confirmar').click());
  const [, init] = fetchMock.mock.calls.find((c) => c[0] === '/lol-lobby/v2/lobby')!;
  expect(JSON.parse(init.body)).toEqual({
    queueId: 3140, isCustom: true,
    customGameLobby: { lobbyName: 'Treino', lobbyPassword: '', configuration: { gameMode: 'PRACTICETOOL', mapId: 11, mutators: { id: 19 }, spectatorPolicy: 'NotAllowed', teamSize: 5 } },
  });
});

test('trocar de modo escolhe a primeira fila JxJ dele e mostra no resumo; categorias aparecem quando há mais de uma', () => {
  mount({
    queues: [queue({ id: 870, name: 'Introdução', gameSelectCategory: 'kVersusAI', gameSelectPriority: 9 }), queue({ id: 400, name: 'Normal' }), queue({ id: 450, name: 'ARAM', gameSelectModeGroup: 'kARAM' })],
    current: 450,
  });
  act(() => btn("Summoner's Rift").click());
  expect(btn('Normal').getAttribute('aria-pressed')).toBe('true');
  expect(root.querySelector('.rlc-modes-summary')!.textContent).toBe("Summoner's Rift · Normal");
  expect([...root.querySelectorAll('.rlc-queue-cat')].map((c) => c.textContent)).toEqual(['JxJ', 'Cooperativo vs. IA']);
});

import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { invitation, queue, readyCheck, ready } from '../../test/fixtures';
import { InvitationCards } from './Invitations';
import { prefs, setPrefs } from '../prefs';
import { ReadyCheckOverlay, ReadyCheckPreview, readyCheckPreview, showReadyCheck } from './ReadyCheck';

let root: HTMLElement;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  setLocale('pt_BR');
  root = document.body.appendChild(document.createElement('div'));
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  render(null, root);
  root.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setPrefs({ readyCheckStyle: 'iris' });
  readyCheckPreview.value = false;
});

const buttons = () => [...root.querySelectorAll('button')];
// Aceitar na íris traz a contagem junto (escondida do leitor de tela): vale o começo do texto.
const byText = (text: string) => buttons().find((b) => b.textContent?.startsWith(text));

test('showReadyCheck: aceite em andamento e sem suppressUx, em qualquer fase (a fila normal pode nem passar por Matchmaking)', () => {
  expect(showReadyCheck(ready(readyCheck()))).toBe(true);
  expect(showReadyCheck(ready(readyCheck({ suppressUx: true })))).toBe(false);
  expect(showReadyCheck(ready(readyCheck({ state: 'Invalid' })))).toBe(false);
  expect(showReadyCheck(ready<never>(null))).toBe(false);
});

test('aceite: Aceitar e Recusar chamam a LCU; mostra o tempo restante', () => {
  act(() => render(<ReadyCheckOverlay rc={readyCheck({ timer: 3 })} />, root));
  expect(root.textContent).toContain('Partida encontrada');
  expect(root.querySelector('.rlc-ring-count')!.textContent).toBe('7');
  act(() => byText('Aceitar')!.click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-matchmaking/v1/ready-check/accept', { method: 'POST' });
  act(() => render(<ReadyCheckOverlay rc={readyCheck({ timer: 3 })} key="b" />, root));
  act(() => byText('Recusar')!.click());
  expect(fetchMock).toHaveBeenCalledWith('/lol-matchmaking/v1/ready-check/decline', { method: 'POST' });
});

test('aceite: marca o gerenciador da Riot enquanto aberto (o aceite nativo não sobe por cima do nosso)', () => {
  const manager = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'lol-uikit-layer-manager' }));
  act(() => render(<ReadyCheckOverlay rc={readyCheck()} />, root));
  expect(manager.hasAttribute('data-rlc-readycheck')).toBe(true);
  act(() => render(null, root));
  expect(manager.hasAttribute('data-rlc-readycheck')).toBe(false);
  manager.remove();
});

test('aceite: tempo restante nunca fica negativo', () => {
  act(() => render(<ReadyCheckOverlay rc={readyCheck({ timer: 14 })} />, root));
  expect(root.querySelector('.rlc-ring-count')!.textContent).toBe('0');
});

test('aceite: depois de responder, os botões somem e fica o estado', () => {
  act(() => render(<ReadyCheckOverlay rc={readyCheck({ playerResponse: 'Accepted' })} />, root));
  expect(buttons()).toHaveLength(0);
  expect(root.textContent).toContain('Aceito, aguardando os outros');
  act(() => render(<ReadyCheckOverlay rc={readyCheck({ playerResponse: 'Declined' })} />, root));
  expect(root.textContent).toContain('Recusado');
});

test('convites: só pendentes, nome como texto, fila pelo nome, aceitar e recusar', () => {
  const a = invitation({ fromSummonerName: '<b>x</b>', gameConfig: { queueId: 440 } as never });
  const b = invitation({ state: 'Declined' });
  act(() => render(<InvitationCards invitations={[a, b]} queues={[queue({ id: 440, name: 'Ranqueada Flex' })]} />, root));
  const cards = root.querySelectorAll('.rlc-invite');
  expect(cards).toHaveLength(1);
  expect(cards[0]!.textContent).toContain('<b>x</b>');
  expect(cards[0]!.textContent).toContain('Ranqueada Flex');
  expect(root.querySelector('b')).toBeNull();
  act(() => byText('Aceitar')!.click());
  expect(fetchMock).toHaveBeenCalledWith(`/lol-lobby/v2/received-invitations/${a.invitationId}/accept`, { method: 'POST' });
  expect(byText('Recusar')!.disabled).toBe(true);
  act(() => render(null, root));
  act(() => render(<InvitationCards invitations={[a]} queues={[]} />, root));
  act(() => byText('Recusar')!.click());
  expect(fetchMock).toHaveBeenCalledWith(`/lol-lobby/v2/received-invitations/${a.invitationId}/decline`, { method: 'POST' });
});

test('convites: canAcceptInvitation falso desabilita Aceitar', () => {
  act(() => render(<InvitationCards invitations={[invitation({ canAcceptInvitation: false })]} queues={[]} />, root));
  expect(byText('Aceitar')!.disabled).toBe(true);
  expect(byText('Recusar')!.disabled).toBe(false);
});

test('convite sem nome usa o nome buscado pelo puuid de quem convidou', async () => {
  const i = invitation({ fromSummonerName: '' });
  act(() => render(<InvitationCards invitations={[i]} queues={[]} name={async (p) => (p === i.fromPuuid ? 'Zeca' : null)} />, root));
  await act(async () => void (await new Promise((r) => setTimeout(r, 0))));
  expect(root.querySelector('.rlc-invite')!.textContent).toContain('Zeca');
});

test('aceite: estilo vem da aparência (íris por padrão); a íris conta o tempo dentro do Aceitar, a onda num anel', () => {
  expect(prefs.value.readyCheckStyle).toBe('iris');
  act(() => render(<ReadyCheckOverlay rc={readyCheck({ timer: 3 })} />, root));
  const veil = root.querySelector<HTMLElement>('.rlc-readycheck')!;
  expect(veil.getAttribute('data-style')).toBe('iris');
  expect(veil.style.getPropertyValue('--rlc-rc-left')).toBe('0.7');
  expect(root.querySelector('.rlc-rcheck-in')!.textContent).toBe('7');
  act(() => setPrefs({ readyCheckStyle: 'wave' }));
  expect(veil.getAttribute('data-style')).toBe('wave');
  expect(root.querySelector('.rlc-rcheck-in')).toBeNull();
  const left = root.querySelector('.rlc-rcheck-ring [data-part="left"]')!;
  expect(Number(left.getAttribute('stroke-dashoffset'))).toBeCloseTo(2 * Math.PI * 46 * 0.3);
  // Cada estilo tem as próprias peças: cortina com placas, cinema com barras.
  act(() => setPrefs({ readyCheckStyle: 'curtain' }));
  expect(root.querySelectorAll('.rlc-rcheck-plate')).toHaveLength(2);
  act(() => setPrefs({ readyCheckStyle: 'cinema' }));
  expect(root.querySelectorAll('.rlc-rcheck-letterbox')).toHaveLength(2);
});

test('prévia do aceite: responder não chama a LCU e fecha sozinha', async () => {
  vi.useFakeTimers();
  readyCheckPreview.value = true;
  act(() => render(<ReadyCheckPreview />, root));
  act(() => byText('Aceitar')!.click());
  await act(async () => void (await vi.advanceTimersByTimeAsync(300)));
  expect(root.textContent).toContain('Aceito, aguardando os outros');
  await act(async () => void (await vi.advanceTimersByTimeAsync(1600)));
  expect(readyCheckPreview.value).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});

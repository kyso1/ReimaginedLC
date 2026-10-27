import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { fakeLcu } from '../../test/fixtures';
import { editedPage, QuickPlayEditor, type Slot } from './QuickPlay';

const page = (id: number, lastModified: number, o: object = {}) => ({ id, name: `P${id}`, isValid: true, lastModified, selectedPerkIds: [8005, 9111], primaryStyleId: 8000, subStyleId: 8100, ...o });

afterEach(() => vi.unstubAllGlobals());

test('página criada ou alterada no editor é a que a vaga passa a usar; nada mudou, nada muda', () => {
  const before = [page(1, 10), page(2, 20)];
  expect(editedPage(before, before)).toBeNull();
  expect(editedPage(before, [page(1, 10), page(2, 25)])!.id).toBe(2);
  expect(editedPage(before, [...before, page(3, 30)])!.id).toBe(3);
  // Página nova ainda incompleta (inválida): não vai para a vaga.
  expect(editedPage(before, [...before, page(4, 40, { isValid: false })])).toBeNull();
});

test('lápis abre o editor de runas; ao fechar, a vaga recebe a página que mudou', async () => {
  setLocale('pt_BR');
  let pages = [page(1, 10)];
  const puts: unknown[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (url === '/lol-perks/v1/pages') return new Response(JSON.stringify(pages));
    if (url === '/lol-lobby/v1/lobby/members/localMember/player-slots' && init?.method === 'PUT') {
      puts.push(JSON.parse(String(init.body)));
      return new Response('');
    }
    return new Response('null');
  });
  const slots: Slot[] = [{ championId: 103, skinId: 103000, positionPreference: 'MIDDLE', perks: '', spell1: 4, spell2: 14 }];
  const root = document.body.appendChild(document.createElement('div'));
  await act(async () => render(<QuickPlayEditor lcu={fakeLcu()} slots={slots} queueId={480} summonerId={1} initial={0} onClose={() => {}} />, root));
  const pencil = () => root.querySelector<HTMLButtonElement>('button[aria-label="Editar ou criar runas"]');
  await vi.waitFor(() => expect(pencil()).not.toBeNull());
  await act(async () => pencil()!.click());
  await vi.waitFor(() => expect(root.querySelector('.rlc-re')).not.toBeNull());
  // Os efeitos do editor (o Escape dele) rodam depois da pintura.
  await act(async () => void (await new Promise((r) => setTimeout(r, 30))));
  // Criou uma página no editor e fechou.
  pages = [page(1, 10), page(7, 50, { selectedPerkIds: [8112, 8139], primaryStyleId: 8100, subStyleId: 8300 })];
  await act(async () => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  await vi.waitFor(() => expect(puts).toHaveLength(1));
  expect(root.querySelector('.rlc-re')).toBeNull();
  expect((puts[0] as Slot[])[0]!.perks).toBe(JSON.stringify({ perkIds: [8112, 8139], perkStyle: 8100, perkSubStyle: 8300 }));
  render(null, root);
  root.remove();
});

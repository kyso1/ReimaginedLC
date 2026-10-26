import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { fakeLcu } from '../../test/fixtures';
import { grantItems, Rewards, toCelebrate, type RewardGrant } from './Rewards';

afterEach(() => vi.unstubAllGlobals());
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

const reward = (id: string, title: string) => ({ id, localizations: { title }, media: { iconUrl: `/i/${id}.png` } });
const grant = (id: string, over: Partial<RewardGrant['info']> = {}, group: Partial<RewardGrant['rewardGroup']> = {}): RewardGrant => ({
  info: { id, rewardGroupId: `rg-${id}`, status: 'FULFILLED', viewed: false, ...over },
  rewardGroup: { celebrationType: 'TOAST', localizations: { title: 'Caos' }, rewards: [reward('a', 'Poro'), reward('b', 'Bala')], ...group },
});

test('mostra o não visto e a escolha pendente; seleção mostra só o que foi entregue', () => {
  const list = [grant('1'), grant('2', { viewed: true }), grant('3', { status: 'PENDING_SELECTION', viewed: true }, { selectionStrategyConfig: { minSelectionsAllowed: 1, maxSelectionsAllowed: 1 } }), grant('4', {}, { celebrationType: 'NONE' })];
  expect(toCelebrate(list).map((g) => g.info.id)).toEqual(['1', '3']);
  expect(grantItems(grant('5', { grantElements: [{ elementId: 'b' }] })).map((i) => i.name)).toEqual(['Bala']);
});

test('recompensa nova aparece por cima de tudo e fechar marca como vista', async () => {
  setLocale('pt_BR');
  const f = vi.fn(async (url: string, _init?: RequestInit) => new Response(url === '/lol-rewards/v1/grants' ? JSON.stringify([grant('g1')]) : '', { status: 200 }));
  vi.stubGlobal('fetch', f);
  const root = document.body.appendChild(document.createElement('div'));
  act(() => render(<Rewards lcu={fakeLcu()} />, root));
  await settle();
  expect(root.textContent).toContain('Poro');
  act(() => root.querySelector<HTMLButtonElement>('button[data-variant="primary"]')!.click());
  const view = f.mock.calls.find((c) => c[0] === '/lol-rewards/v1/grants/view')!;
  expect(view[1]).toMatchObject({ method: 'PATCH', body: JSON.stringify(['g1']) });
  expect(root.textContent).toBe('');
  render(null, root);
  root.remove();
});

import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { fakeLcu } from '../../test/fixtures';
import { Clash } from './Clash';

afterEach(() => vi.unstubAllGlobals());
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));

async function mount(routes: Record<string, unknown>) {
  setLocale('pt_BR');
  vi.stubGlobal('fetch', async (url: string) => new Response(JSON.stringify(routes[url] ?? null), { status: url in routes ? 200 : 404 }));
  const root = document.createElement('div');
  act(() => render(<Clash lcu={fakeLcu()} />, root));
  await settle();
  await settle();
  return root;
}

test('Clash em tela própria: troféu, patamar, pontos, ingressos e o vazio sem torneio', async () => {
  const root = await mount({ '/lol-clash/v1/player': { tier: 2, tickets: { BASIC: 1 } }, '/lol-clash/v1/rewards': { seasonVp: 1450 }, '/lol-clash/v1/all-tournaments': [] });
  expect(root.querySelector('.rlc-clash-trophy')).not.toBeNull();
  const text = root.textContent!;
  expect(text).toContain('II');
  expect(text).toContain('1.450');
  expect(text).toContain('Nenhum torneio agendado');
});

test('sem patamar e sem temporada (-1 da LCU) mostra traço, nunca -1', async () => {
  const root = await mount({ '/lol-clash/v1/player': { tier: -1, tickets: {} }, '/lol-clash/v1/rewards': { seasonVp: -1 }, '/lol-clash/v1/all-tournaments': [] });
  expect(root.textContent).not.toContain('-1');
  expect([...root.querySelectorAll('.rlc-ev-stats b')].slice(0, 2).map((b) => b.textContent)).toEqual(['—', '—']);
});

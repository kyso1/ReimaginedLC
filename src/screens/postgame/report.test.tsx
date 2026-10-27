import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { reportBody, ReportDialog } from './Report';

afterEach(() => vi.unstubAllGlobals());
const target = { puuid: 'p-zeca', summonerId: 42, name: 'Zeca' };

test('denúncia vai no formato do client: categorias, comentário, summonerId e puuid', () => {
  expect(reportBody(9, target, ['VERBAL_ABUSE'], '  feio  ')).toEqual({ comment: 'feio', gameId: 9, categories: ['VERBAL_ABUSE'], offenderSummonerId: 42, offenderPuuid: 'p-zeca' });
});

test('enviar só com categoria marcada; TFT não tem as categorias de jogar para vencer', async () => {
  setLocale('pt_BR');
  const f = vi.fn(async (_u: string, _i?: RequestInit) => new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', f);
  const onSent = vi.fn();
  const root = document.body.appendChild(document.createElement('div'));
  act(() => render(<ReportDialog gameId={9} target={target} game="lol" onSent={onSent} onClose={() => {}} />, root));
  const send = () => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Enviar denúncia')!;
  expect(send().disabled).toBe(true);
  const box = [...root.querySelectorAll('label')].find((l) => l.textContent === 'Abuso verbal')!.querySelector('input')!;
  act(() => box.click());
  expect(send().disabled).toBe(false);
  await act(async () => send().click());
  await act(async () => void (await new Promise((r) => setTimeout(r, 0))));
  const call = f.mock.calls.find((c) => c[0] === '/lol-player-report-sender/v1/end-of-game-reports')!;
  expect(JSON.parse(String(call[1]!.body)).categories).toEqual(['VERBAL_ABUSE']);
  expect(onSent).toHaveBeenCalled();
  act(() => render(<ReportDialog gameId={9} target={target} game="tft" onSent={() => {}} onClose={() => {}} />, root));
  expect(root.textContent).not.toContain('Saiu ou ficou ausente');
  render(null, root);
  root.remove();
});

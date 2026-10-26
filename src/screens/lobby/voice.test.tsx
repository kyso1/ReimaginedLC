import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { fakeLcu } from '../../test/fixtures';
import { Voice } from './Voice';

afterEach(() => vi.unstubAllGlobals());
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))));
const avail = (voiceChannelAvailable: boolean) => ({ enabled: true, showUI: true, voiceChannelAvailable, connectedToVoiceServer: true });

async function mount(routes: Record<string, unknown>) {
  setLocale('pt_BR');
  const f = vi.fn(async (url: string, _init?: RequestInit) => new Response(JSON.stringify(routes[url] ?? null), { status: url in routes ? 200 : 204 }));
  vi.stubGlobal('fetch', f);
  const root = document.createElement('div');
  act(() => render(<Voice lcu={fakeLcu()} />, root));
  await settle();
  await settle();
  return { root, f };
}

test('fora do canal: Entrar na voz (desabilitado sozinho no grupo); clique entra', async () => {
  const alone = await mount({ '/lol-premade-voice/v1/availability': avail(false), '/lol-premade-voice/v1/session': { id: '', participants: [] } });
  expect(alone.root.querySelector<HTMLButtonElement>('.rlc-voice')!.disabled).toBe(true);
  const { root, f } = await mount({ '/lol-premade-voice/v1/availability': avail(true), '/lol-premade-voice/v1/session': { id: '', participants: [] } });
  act(() => root.querySelector<HTMLButtonElement>('.rlc-voice')!.click());
  expect(f.mock.calls.some((c) => c[0] === '/lol-premade-voice/v1/session' && c[1]?.method === 'POST')).toBe(true);
});

test('no canal: mutar manda 1 e sair apaga a sessão; aperte-para-falar desliga o mudo', async () => {
  const { root, f } = await mount({
    '/lol-premade-voice/v1/availability': avail(true),
    '/lol-premade-voice/v1/session': { id: 's1', participants: [] },
    '/lol-premade-voice/v1/settings': { inputMode: 'voiceActivity', localMicMuted: false },
    '/lol-premade-voice/v1/participants': [{ puuid: 'a', displayName: 'Zeca', isSpeaking: true }],
  });
  act(() => root.querySelector<HTMLButtonElement>('.rlc-voice')!.click());
  const put = f.mock.calls.find((c) => c[0] === '/lol-premade-voice/v1/self/mute')!;
  expect(put[1]).toMatchObject({ method: 'PUT', body: '1' });
  act(() => root.querySelector<HTMLButtonElement>('.rlc-voice-leave')!.click());
  expect(f.mock.calls.some((c) => c[0] === '/lol-premade-voice/v1/session' && c[1]?.method === 'DELETE')).toBe(true);
  const ptt = await mount({ '/lol-premade-voice/v1/availability': avail(true), '/lol-premade-voice/v1/session': { id: 's1' }, '/lol-premade-voice/v1/settings': { inputMode: 'pushToTalk', pttKey: '[V]' } });
  const b = ptt.root.querySelector<HTMLButtonElement>('.rlc-voice')!;
  expect(b.disabled).toBe(true);
  expect(b.title).toBe('Aperte para falar: V');
});

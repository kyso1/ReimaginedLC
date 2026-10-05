import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../i18n';
import { LcuError, request } from './request';

const res = (status: number, body = '') => new Response(body || null, { status });

beforeEach(() => {
  setLocale('pt_BR');
  window.Toast = { success: vi.fn(), error: vi.fn() };
});
afterEach(() => void delete window.Toast);

test('envia método, JSON e devolve o corpo', async () => {
  const f = vi.fn().mockResolvedValue(res(200, '{"a":1}'));
  expect(await request('POST', '/x', { q: 1 }, f)).toEqual({ a: 1 });
  expect(f).toHaveBeenCalledWith('/x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"q":1}' });
});

test('204 e corpo vazio devolvem null; sem body não envia Content-Type', async () => {
  const f = vi.fn().mockResolvedValue(res(204));
  expect(await request('DELETE', '/x', undefined, f)).toBeNull();
  expect(f).toHaveBeenCalledWith('/x', { method: 'DELETE' });
});

test('corpo string é enviado como JSON de string', async () => {
  const f = vi.fn().mockResolvedValue(res(204));
  await request('PUT', '/x', 'open', f);
  expect(f.mock.calls[0]![1].body).toBe('"open"');
});

test('erro com message da LCU vira Toast e LcuError', async () => {
  const f = vi.fn().mockResolvedValue(res(400, '{"errorCode":"RPC_ERROR","message":"INVALID_LOBBY"}'));
  await expect(request('POST', '/x', {}, f)).rejects.toBeInstanceOf(LcuError);
  expect(window.Toast!.error).toHaveBeenCalledWith('INVALID_LOBBY');
});

test('erro sem corpo ou não JSON usa mensagem genérica com o status', async () => {
  for (const r of [res(500), res(502, '<html>')]) {
    vi.mocked(window.Toast!.error).mockClear();
    await expect(request('GET', '/x', undefined, vi.fn().mockResolvedValue(r))).rejects.toBeInstanceOf(LcuError);
    expect(window.Toast!.error).toHaveBeenCalledWith(expect.stringMatching(/^Erro da LCU \(5\d\d\)$/));
  }
});

test('falha de rede vira Toast e LcuError', async () => {
  await expect(request('GET', '/x', undefined, vi.fn().mockRejectedValue(new TypeError('x')))).rejects.toBeInstanceOf(LcuError);
  expect(window.Toast!.error).toHaveBeenCalledWith('Sem conexão com o client');
});

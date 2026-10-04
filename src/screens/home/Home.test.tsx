import { render } from 'preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setLocale } from '../../i18n';
import { Home, patchNotesUrl, shortPatch } from './Home';

let host: HTMLElement;

beforeEach(() => {
  setLocale('pt_BR');
  host = document.body.appendChild(document.createElement('div'));
  window.Toast = { success: vi.fn(), error: vi.fn() };
});

afterEach(() => {
  render(null, host);
  host.remove();
  delete window.Toast;
});

const button = (text: string) => Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(text));

test('shortPatch extrai os dois primeiros números da versão do client', () => {
  expect(shortPatch('16.19.823.0722')).toBe('16.19');
  expect(shortPatch('9.1.1')).toBe('9.1');
  for (const v of [null, undefined, '', 'abc', '16']) expect(shortPatch(v)).toBeNull();
});

test('patchNotesUrl monta o endereço pelo locale e cai em en-us', () => {
  expect(patchNotesUrl('pt_BR')).toBe('https://www.leagueoflegends.com/pt-br/news/tags/patch-notes/');
  expect(patchNotesUrl('en_US')).toBe('https://www.leagueoflegends.com/en-us/news/tags/patch-notes/');
  for (const l of [null, undefined, '', '../x', 'pt_BR/evil', 'javascript:alert(1)']) {
    expect(patchNotesUrl(l)).toBe('https://www.leagueoflegends.com/en-us/news/tags/patch-notes/');
  }
});

test('Jogar chama onPlay', () => {
  const onPlay = vi.fn();
  render(<Home version="16.19.823.0722" locale="pt_BR" onPlay={onPlay} />, host);
  button('Jogar')!.click();
  expect(onPlay).toHaveBeenCalledTimes(1);
});

test('mostra a versão curta e abre as notas do patch', () => {
  const open = vi.fn().mockReturnValue({});
  render(<Home version="16.19.823.0722" locale="pt_BR" onPlay={() => {}} open={open} />, host);
  const pill = button('16.19')!;
  expect(pill.textContent).toContain('Notas do patch');
  pill.click();
  expect(open).toHaveBeenCalledWith('https://www.leagueoflegends.com/pt-br/news/tags/patch-notes/');
});

test('sem versão conhecida, o atalho mostra só o rótulo', () => {
  render(<Home version={null} locale="pt_BR" onPlay={() => {}} />, host);
  expect(button('Notas do patch')!.textContent!.trim()).toBe('Notas do patch');
});

test('se abrir falhar, avisa com Toast', () => {
  render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} open={() => null} />, host);
  button('Notas do patch')!.click();
  expect(window.Toast!.error).toHaveBeenCalledTimes(1);
  render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} open={() => { throw new Error('bloqueado'); }} />, host);
  button('Notas do patch')!.click();
  expect(window.Toast!.error).toHaveBeenCalledTimes(2);
});

test('a tela inicial não mostra nome de invocador', () => {
  render(<Home version="16.19.1" locale="pt_BR" onPlay={() => {}} />, host);
  expect(host.textContent).not.toMatch(/Fulano|anon-/);
  expect(host.querySelectorAll('button')).toHaveLength(2);
});

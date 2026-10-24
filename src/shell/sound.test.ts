import { expect, test } from 'vitest';
import { clickSound } from './sound';

const el = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild!.querySelector('span') ?? host.firstElementChild!;
};

test('clique: principal toca confirmar, abas e chips tocam aba, o resto clique comum; desabilitado não toca', () => {
  expect(clickSound(el('<button data-variant="primary"><span>Jogar</span></button>'))).toBe('confirm');
  expect(clickSound(el('<button role="tab">Skins</button>'))).toBe('tab');
  expect(clickSound(el('<button class="rlc-queue-chip">Normal</button>'))).toBe('tab');
  expect(clickSound(el('<button>Voltar</button>'))).toBe('click');
  expect(clickSound(el('<button disabled>Voltar</button>'))).toBeNull();
  expect(clickSound(el('<div>texto</div>'))).toBeNull();
});

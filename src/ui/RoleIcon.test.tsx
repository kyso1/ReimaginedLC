import { render } from 'preact';
import { expect, test } from 'vitest';
import { RoleIcon, roleOf } from './RoleIcon';

test('rota de qualquer fonte vira a do client; o resto é sem posição', () => {
  expect(['top', 'JUNGLE', 'mid', 'MIDDLE', 'ADC', 'bottom', 'SUPPORT', 'utility', 'FILL'].map(roleOf)).toEqual(['TOP', 'JUNGLE', 'MIDDLE', 'MIDDLE', 'BOTTOM', 'BOTTOM', 'UTILITY', 'UTILITY', 'FILL']);
  expect([undefined, '', 'NONE', 'UNSELECTED'].map(roleOf)).toEqual(['UNSELECTED', 'UNSELECTED', 'UNSELECTED', 'UNSELECTED']);
});

test('desenho em linha com currentColor, sem imagem da Riot, escondido dos leitores de tela', () => {
  const root = document.createElement('div');
  for (const r of ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'FILL', 'UNSELECTED']) {
    render(<RoleIcon role={r} class="x" />, root);
    const svg = root.querySelector('svg')!;
    expect(svg.getAttribute('data-role')).toBe(r);
    expect(svg.getAttribute('class')).toBe('rlc-role x');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.children.length).toBeGreaterThan(0);
    expect(root.innerHTML).not.toMatch(/#[0-9a-f]{3,6}|rgb|<img/i);
  }
  render(null, root);
});

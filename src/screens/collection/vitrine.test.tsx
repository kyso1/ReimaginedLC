import { render } from 'preact';
import { expect, test } from 'vitest';
import { Vitrine } from './Vitrine';

test('retratos da grade carregam e decodificam sob demanda', () => {
  const root = document.body.appendChild(document.createElement('div'));
  const items = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Ícone ${i}`, art: `/fe/i/${i}.png`, owned: true }));
  render(<Vitrine items={items} placeholder="Buscar" onPick={() => {}} detail={null} onClose={() => {}} />, root);
  const imgs = [...root.querySelectorAll('.rlc-vt-tile img')];
  expect(imgs).toHaveLength(3);
  for (const img of imgs) {
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  }
  render(null, root);
  root.remove();
});

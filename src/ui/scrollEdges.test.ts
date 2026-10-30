import { expect, test } from 'vitest';
import { watchScrollEdges } from './scrollEdges';

test('marca no meio e no fim da rolagem; volta a não marcar no topo', () => {
  const root = document.body.appendChild(document.createElement('div'));
  const box = root.appendChild(document.createElement('div'));
  Object.defineProperties(box, { scrollHeight: { value: 300 }, clientHeight: { value: 100 }, scrollWidth: { value: 100 }, clientWidth: { value: 100 } });
  watchScrollEdges(root);
  const scroll = (top: number) => {
    box.scrollTop = top;
    box.dispatchEvent(new Event('scroll'));
  };
  scroll(50);
  expect(box.dataset.rlcY).toBe('mid');
  scroll(200);
  expect(box.dataset.rlcY).toBe('end');
  scroll(0);
  expect(box.dataset.rlcY).toBeUndefined();
  expect(box.dataset.rlcX).toBeUndefined();
  root.remove();
});

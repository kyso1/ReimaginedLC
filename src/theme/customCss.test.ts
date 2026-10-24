import { afterEach, expect, test } from 'vitest';
import { enabled } from '../shell/layer';
import { checkCss, cssPrompt, customCss, setCustomCss, startCustomCss } from './customCss';

afterEach(() => {
  enabled.value = false;
  document.head.querySelectorAll('style[data-rlc-custom]').forEach((s) => s.remove());
});

test('recusa o que carrega coisa de fora ou executa código', () => {
  expect(checkCss('#rlc-root .rlc-button { color: red; }')).toBeNull();
  expect(checkCss('#rlc-root .x { background: url("/fe/lol-static-assets/a.png"); }')).toBeNull();
  expect(checkCss('#rlc-root .x { background: url(/lol-game-data/assets/a.jpg); }')).toBeNull();
  expect(checkCss('@import "https://evil.example/x.css";')).toBe('@import');
  expect(checkCss('#rlc-root .x { background: url(https://evil.example/t.png); }')).toContain('url()');
  expect(checkCss('#rlc-root .x { background: url("//evil.example/t.png"); }')).toContain('url()');
  expect(checkCss('#rlc-root .x { width: expression(alert(1)); }')).toBe('expression()');
  expect(checkCss('x'.repeat(50_001))).toContain('chars');
  // Desvios: escapes CSS, image-set sem url(), comentário entre url( e a string.
  expect(checkCss('#rlc-root .x { background: u\\72l(https://evil.example/t.png); }')).toBe('backslash escapes');
  expect(checkCss('@\\69mport "https://evil.example/x.css";')).toBe('backslash escapes');
  expect(checkCss('#rlc-root .x { background: image-set("https://evil.example/t.png" 1x); }')).toBe('image-set()');
  expect(checkCss('#rlc-root .x { background: -webkit-image-set("https://evil.example/t.png" 1x); }')).toBe('image-set()');
  expect(checkCss('#rlc-root .x { background: url(/**/"https://evil.example/t.png"); }')).toContain('url()');
  expect(checkCss('#rlc-root .x { /* url(https://ok-in-comment) */ color: var(--rlc-color-text); }')).toBeNull();
});

test('só aplica ligado e com a camada à vista', () => {
  startCustomCss();
  expect(setCustomCss({ on: true, css: '#rlc-root { outline: 1px solid; }' })).toBeNull();
  const styles = () => document.head.querySelectorAll('style[data-rlc-custom]');
  expect(styles()).toHaveLength(0);
  enabled.value = true;
  expect(styles()[0]!.textContent).toContain('outline');
  setCustomCss({ ...customCss.value, on: false });
  expect(styles()).toHaveLength(0);
});

test('CSS recusado não é salvo', () => {
  setCustomCss({ on: false, css: 'a{}' });
  expect(setCustomCss({ on: true, css: '@import "x";' })).toBe('@import');
  expect(customCss.value.css).toBe('a{}');
});

test('prompt de CSS leva o pedido e o CSS atual', () => {
  const prompt = cssPrompt('#rlc-root .rlc-rail { gap: 2px; }', 'trilho mais largo');
  expect(prompt).toContain('Request: trilho mais largo');
  expect(prompt).toContain('.rlc-rail { gap: 2px; }');
});

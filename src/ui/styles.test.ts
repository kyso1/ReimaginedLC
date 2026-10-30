import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

/** styles.css e os arquivos por tela em ui/css (importados por ele). */
const ALL = () => ['src/ui/styles.css', ...readdirSync('src/ui/css').map((f) => `src/ui/css/${f}`)].map((f) => readFileSync(f, 'utf8')).join('\n');

// Componentes leem só variáveis do tema. Cor literal é aceita apenas como valor reserva de uma variável `--rlc-*`.
test('styles.css não tem cor literal fora de var(--rlc-*, reserva)', () => {
  const css = ALL().replace(/\/\*[\s\S]*?\*\//g, '');
  const offenders = css
    .split('\n')
    .flatMap((line) => line.split(';'))
    .filter((decl) => /#[0-9a-f]{3,8}\b|rgba?\(/i.test(decl) && !/var\(--rlc-[\w-]+,/.test(decl));
  expect(offenders).toEqual([]);
});

test('styles.css não depende de :has() (regra do projeto para o Chromium do client)', () => {
  expect(ALL()).not.toContain(':has(');
});

test('editor de runas: o topo (com a lista de páginas) fica acima das colunas das árvores', () => {
  const css = ALL();
  // As colunas ganham z-index 1; o topo fica fora dessa regra e acima dela.
  expect(css).toMatch(/\.rlc-re > :not\(\.rlc-re-art\):not\(\.rlc-re-tip\):not\(\.rlc-veil\):not\(\.rlc-re-top\) \{ position: relative; z-index: 1; \}/);
  const top = /#rlc-root \.rlc-re > \.rlc-re-top \{[^}]*z-index: (\d+)/.exec(css);
  expect(Number(top?.[1])).toBeGreaterThan(1);
});

test('aba de site da Riot (notas do patch, Worlds) ocupa a área toda do Início, sem moldura, como o quadro do client', () => {
  const rule = /#rlc-root \.rlc-feat-embed \{([^}]*)\}/.exec(ALL())?.[1] ?? '';
  expect(rule).toContain('inset: 0');
  expect(rule).toContain('border: 0');
  expect(rule).not.toMatch(/left: \d|top: \d/);
});

test('cartão da seleção: nenhuma regra própria do menu dentro dele (ele abre solto na tela)', () => {
  expect(ALL()).not.toContain('.rlc-cs-cell .rlc-menu');
});

test('pós-jogo: Sair e Replay ficam à direita, fora do canto do chat da sala', () => {
  const rule = /#rlc-root \.rlc-pg-actions \{([^}]*)\}/.exec(ALL())?.[1] ?? '';
  expect(rule).toContain('right: 32px');
  expect(rule).not.toMatch(/left:/);
  expect(rule).toContain('justify-content: flex-end');
});

test('lobby: com o chat da sala aberto, a primeira vaga sobe (com animação); a vazia da sala personalizada também', () => {
  const css = ALL();
  expect(css).toContain(".rlc-app[data-screen='lobby'][data-room-chat='open'] .rlc-stage:not([data-band='blue']) > .rlc-col:first-child:not([data-empty='true']) { padding-bottom: 292px; }");
  expect(css).toContain(".rlc-app[data-screen='lobby'][data-room-chat='open'] .rlc-stage[data-band='red'] > .rlc-col:first-child[data-empty='true'] { padding-bottom: 320px; }");
  expect(css).toMatch(/\.rlc-stage > \.rlc-col:first-child, #rlc-root \.rlc-app\[data-screen='lobby'\] \.rlc-stage > \.rlc-col:first-child > \.rlc-col-legend \{ transition: padding-bottom/);
});

test('gaveta de amigos: aberta passa por cima da folha de modos, mas fica abaixo de menus soltos e avisos', () => {
  const css = ALL();
  const z = (sel: string) => {
    const start = css.indexOf(`#rlc-root ${sel} {`);
    return Number(/z-index: (\d+)/.exec(css.slice(start, css.indexOf('}', start)))![1]);
  };
  expect(z('.rlc-rc')).toBeGreaterThan(z('.rlc-modes'));
  expect(z('.rlc-rc')).toBeLessThan(z('.rlc-menu-backdrop[data-floating]'));
  expect(z('.rlc-rc')).toBeLessThan(z('.rlc-veil'));
  // Os botões da janela e o aviso de atualização ficam à esquerda da faixa (solta ou fixa), com folga, nunca embaixo dela.
  for (const sel of ['.rlc-winbtns', '.rlc-update-notice']) {
    const gap = new RegExp(`#rlc-root \\.rlc-app \\${sel} \\{ right: calc\\(var\\(--rlc-social-w\\) \\+ (\\d+)px\\); \\}`).exec(css);
    expect(Number(gap?.[1]), sel).toBeGreaterThanOrEqual(12);
  }
});

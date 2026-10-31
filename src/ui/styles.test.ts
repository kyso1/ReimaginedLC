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

test('maestria: busca e ordens numa linha só; o nível não é cortado pelo círculo do retrato', () => {
  const rule = (sel: string) => new RegExp(`#rlc-root ${sel.replace(/\./g, '\.')} \{([^}]*)\}`).exec(ALL())?.[1] ?? '';
  expect(rule('.rlc-ms .rlc-chip-row')).toContain('max-width: none');
  expect(rule('.rlc-ms .rlc-chip-row')).toContain('flex-wrap: nowrap');
  expect(rule('.rlc-ms-ring')).not.toContain('overflow: hidden');
  expect(rule('.rlc-ms-ring img')).toContain('border-radius: 50%');
});

test('TFT: a arte da Pequena Lenda enche a ponta esquerda da linha e some para a direita, atrás da colocação', () => {
  const rule = (sel: string) => new RegExp(`#rlc-root ${sel.replace(/[.[\]]/g, '\\$&')} \\{([^}]*)\\}`).exec(ALL())?.[1] ?? '';
  const art = rule('.rlc-pf-sheet .rlc-tft-row .rlc-tft-legend');
  expect(art).toContain('position: absolute');
  expect(art).toContain('object-fit: cover');
  expect(art).toMatch(/-webkit-mask-image: linear-gradient\(90deg/);
  expect(rule('.rlc-pf-sheet .rlc-mh-row.rlc-tft-row')).toMatch(/grid-template-columns: \d+px minmax\(0, 1fr\) \d+px/);
});

test('personalizar: a área que rola tem folga em volta, para o contorno do item escolhido (2px + 2px de recuo) não ser cortado nas bordas', () => {
  const body = /#rlc-root \.rlc-idm-body \{([^}]*)\}/.exec(ALL())?.[1] ?? '';
  expect(body).toContain('overflow-y: auto');
  expect(body).toMatch(/padding: 4px;/);
  // Puxa de volta para a esquerda: a grade continua alinhada com a busca.
  expect(body).toContain('margin-left: -4px');
});

test('histórico: a pílula do menu de filas desliza (transição) até a opção marcada em --i', () => {
  const pill = /#rlc-root \.rlc-pf-menu-pill \{([^}]*)\}/.exec(ALL())?.[1] ?? '';
  expect(pill).toContain('position: absolute');
  expect(pill).toMatch(/transform: translateY\(calc\(var\(--i, 0\) \* 32px\)\)/);
  expect(pill).toMatch(/transition: transform/);
});

test('loja: o X da gaveta fica abaixo dos botões da janela; nomes dos cartões em até duas linhas; Sua Loja sem cartão esticado', () => {
  const css = ALL();
  const rule = (sel: string) => new RegExp(`#rlc-root ${sel.replace(/[.[\]]/g, '\$&')} \{([^}]*)\}`).exec(css)?.[1] ?? '';
  expect(Number(/top: (\d+)px/.exec(rule('.rlc-sto-x'))?.[1])).toBeGreaterThanOrEqual(44);
  expect(rule('.rlc-sto-info b')).toContain('-webkit-line-clamp: 2');
  expect(rule('.rlc-sto-ys')).toContain('align-content: start');
});

test('loja: o botão Ver do banner fica acima dos pontinhos do carrossel, sem encostar neles', () => {
  const css = ALL();
  const go = /#rlc-root \.rlc-sto-hero \.rlc-sto-hero-go \{([^}]*)\}/.exec(css)?.[1] ?? '';
  const dots = /#rlc-root \.rlc-sto-dots \{ position: absolute;([^}]*)\}/.exec(css)?.[1] ?? '';
  const bottom = (r: string) => Number(/bottom: (\d+)px/.exec(r)?.[1]);
  // Pontinhos: 4px de altura a partir do fundo; o botão começa pelo menos 10px acima deles.
  expect(bottom(go)).toBeGreaterThanOrEqual(bottom(dots) + 4 + 10);
});

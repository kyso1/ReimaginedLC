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

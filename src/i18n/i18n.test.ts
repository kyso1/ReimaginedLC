import { expect, test } from 'vitest';
import en from './en-US.json';
import pt from './pt-BR.json';

// Os textos ficam em JSON para quem traduz não precisar mexer em código. Os dois idiomas têm as mesmas chaves, sem texto vazio.
test('pt-BR e en-US têm as mesmas chaves e nenhum texto vazio', () => {
  expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
  for (const [lang, texts] of Object.entries({ pt, en })) {
    const empty = Object.entries(texts).filter(([, v]) => typeof v !== 'string' || !v.trim());
    expect(empty, lang).toEqual([]);
  }
});

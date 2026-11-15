import { expect, test } from 'vitest';
import { benchDiff, flights, type FlightSnapshot } from './aramFx';

const snap = (cells: Array<[number, number]>, bench: number[], cards: number[] = [], me = 0): FlightSnapshot => ({ me, cells, bench, cards });

test('banco entre duas sessões: quem chegou e quem saiu, na ordem das vagas', () => {
  expect(benchDiff([1, 2, 3], [2, 4, 5])).toEqual({ added: [4, 5], removed: [1, 3] });
  expect(benchDiff([], [7])).toEqual({ added: [7], removed: [] });
  expect(benchDiff([7], [])).toEqual({ added: [], removed: [7] });
  // Só mudou a ordem: ninguém chegou nem saiu.
  expect(benchDiff([1, 2], [2, 1])).toEqual({ added: [], removed: [] });
});

test('nada mudou (ou só a carta sob o mouse): nenhum voo', () => {
  const s = snap([[0, 0], [1, 5]], [9], [2, 3, 4]);
  expect(flights(s, s)).toEqual([]);
  expect(flights(s, snap([[0, 0], [1, 5]], [9], []))).toEqual([]);
});

test('carta escolhida: voa para o meu cartão e as que sobraram para o banco', () => {
  const before = snap([[0, 0], [1, 0]], [], [2, 3, 4]);
  expect(flights(before, snap([[0, 3], [1, 0]], [2, 4]))).toEqual([
    { championId: 3, from: 'card:3', to: 'cell:0' },
    { championId: 2, from: 'card:2', to: 'bench:2' },
    { championId: 4, from: 'card:4', to: 'bench:4' },
  ]);
  // O banco ainda não foi atualizado nesta sessão: só a carta escolhida voa (as outras aparecem quando chegarem).
  expect(flights(before, snap([[0, 3], [1, 0]], []))).toEqual([{ championId: 3, from: 'card:3', to: 'cell:0' }]);
});

test('pegar do banco: o campeão voa da vaga para o cartão e o antigo faz o caminho de volta (eu ou um aliado)', () => {
  expect(flights(snap([[0, 3], [1, 5]], [9, 8]), snap([[0, 9], [1, 5]], [3, 8]))).toEqual([
    { championId: 9, from: 'bench:9', to: 'cell:0' },
    { championId: 3, from: 'cell:0', to: 'bench:3' },
  ]);
  expect(flights(snap([[0, 3], [1, 5]], [9]), snap([[0, 3], [1, 9]], [5]))).toEqual([
    { championId: 9, from: 'bench:9', to: 'cell:1' },
    { championId: 5, from: 'cell:1', to: 'bench:5' },
  ]);
});

test('troca entre aliados: cada retrato voa do cartão de um para o do outro', () => {
  expect(flights(snap([[0, 3], [1, 5], [2, 7]], [9]), snap([[0, 5], [1, 3], [2, 7]], [9]))).toEqual([
    { championId: 5, from: 'cell:1', to: 'cell:0' },
    { championId: 3, from: 'cell:0', to: 'cell:1' },
  ]);
});

test('sem origem conhecida não há voo: cartas dos aliados no banco, rolagem, a carta do aliado no cartão dele', () => {
  // Cartas que um aliado deixou (a LCU não mostra as cartas dele).
  expect(flights(snap([[0, 3], [1, 0]], []), snap([[0, 3], [1, 0]], [6, 7]))).toEqual([]);
  // O aliado escolheu a carta dele: o campeão aparece no cartão, sem voo; a que sobrou chega ao banco sem voo.
  expect(flights(snap([[0, 3], [1, 0]], [], [3, 4]), snap([[0, 3], [1, 8]], [6], [3, 4]))).toEqual([]);
  // Rolagem (ARAM antigo): o novo vem do nada; o antigo vai para o banco.
  expect(flights(snap([[0, 3]], []), snap([[0, 4]], [3]))).toEqual([{ championId: 3, from: 'cell:0', to: 'bench:3' }]);
  // Carta com o mesmo campeão que um aliado pegou não é a minha carta voando para ele.
  expect(flights(snap([[0, 0], [1, 0]], [], [2, 3]), snap([[0, 0], [1, 2]], [], [2, 3]))).toEqual([]);
  // Jogador que entrou na sessão agora (vaga nova) não conta como mudança.
  expect(flights(snap([[0, 3]], []), snap([[0, 3], [1, 5]], []))).toEqual([]);
});

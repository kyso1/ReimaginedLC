import { expect, test } from 'vitest';
import { abyssAssets, abyssPinTimes, abyssSpots, ABYSS_BOUNDS, ABYSS_ELEV, ABYSS_MESH_STRIDE, ABYSS_SPRITE_STRIDE, ABYSS_TARGET, ABYSS_YAW, assembleDelay, BASE_X, BRIDGE_END, BRIDGE_HALF, buildAbyss, onGround, SLAB, SLABS } from './abyss';
import { fitAbyss } from './abyssScene';
import { orbit, toScreen } from './camera';

test('a ponte liga as duas bases: as lajes cobrem de uma ponta à outra e as plataformas a alcançam', () => {
  expect(SLABS * SLAB).toBe(BRIDGE_END * 2);
  // Chão firme: o meio da ponte, a borda dela e o centro de cada base; fora da ponte é abismo.
  expect(onGround([0, 0])).toBe(true);
  expect(onGround([BRIDGE_END, BRIDGE_HALF])).toBe(true);
  expect(onGround([-BASE_X, 0])).toBe(true);
  expect(onGround([BASE_X, 150])).toBe(true);
  expect(onGround([0, BRIDGE_HALF + 20])).toBe(false);
  // A plataforma da base começa antes de a ponte acabar: não há vão entre as duas.
  expect(onGround([-BRIDGE_END - 30, 0])).toBe(true);
});

test('a ponte se monta da minha base até a inimiga: quanto mais longe, mais tarde a peça sobe', () => {
  expect(assembleDelay(-BASE_X)).toBeLessThan(assembleDelay(-BRIDGE_END));
  expect(assembleDelay(-BRIDGE_END)).toBeLessThan(assembleDelay(0));
  expect(assembleDelay(0)).toBeLessThan(assembleDelay(BASE_X));
  // Tudo dentro do progresso da entrada (0..1,25, menos os 0,3 que cada peça leva para subir).
  expect(assembleDelay(-1350)).toBeGreaterThanOrEqual(-0.05);
  expect(assembleDelay(1420)).toBeLessThanOrEqual(0.97);
});

test('cada aliado num ponto firme da minha metade, sem dois no mesmo lugar; eu na frente', () => {
  for (const me of [0, 2, 4]) {
    const spots = abyssSpots(5, me);
    expect(spots).toHaveLength(5);
    expect(new Set(spots.map((p) => p.join())).size).toBe(5);
    for (const p of spots) {
      expect(onGround(p)).toBe(true);
      expect(p[0]).toBeLessThan(0);
    }
    expect(Math.max(...spots.map((p) => p[0]))).toBe(spots[me]![0]);
  }
  // Time incompleto ou maior que o normal: um ponto por vaga, todos firmes e distintos.
  expect(abyssSpots(1, 0)).toHaveLength(1);
  const many = abyssSpots(8, 3);
  expect(new Set(many.map((p) => p.join())).size).toBe(8);
  expect(many.every(onGround)).toBe(true);
  // Sem a minha vaga no time (espectador): ninguém fica com o ponto da frente duas vezes.
  expect(new Set(abyssSpots(5, -1).map((p) => p.join())).size).toBe(5);
});

test('os marcadores caem depois de a ponte chegar a eles, um a um, e o meu por último', () => {
  const times = abyssPinTimes(5, 2);
  expect(times).toHaveLength(5);
  expect(Math.max(...times)).toBe(times[2]);
  expect(new Set(times).size).toBe(5);
  // A entrada vai de 0,2 s a 2,5 s; a laje de cada ponto já subiu quando o marcador cai.
  abyssSpots(5, 2).forEach(([x], i) => expect(times[i]).toBeGreaterThan(0.2 + ((assembleDelay(x) + 0.3) / 1.25) * 2.3));
});

test('peças: buffers inteiros, sem número inválido, normais unitárias, sempre iguais e montadas uma vez só', () => {
  const a = buildAbyss();
  expect(a.mesh.length % (ABYSS_MESH_STRIDE * 3)).toBe(0);
  expect(a.sprites.length % ABYSS_SPRITE_STRIDE).toBe(0);
  expect(a.mesh.length).toBeGreaterThan(ABYSS_MESH_STRIDE * 3 * 1000);
  expect(a.mesh.every(Number.isFinite)).toBe(true);
  expect(a.sprites.every(Number.isFinite)).toBe(true);
  const teams = new Set<number>();
  for (let i = 0; i < a.mesh.length; i += ABYSS_MESH_STRIDE) {
    expect(Math.hypot(a.mesh[i + 3]!, a.mesh[i + 4]!, a.mesh[i + 5]!)).toBeCloseTo(1, 4);
    const team = a.mesh[i + 13]!;
    teams.add(team);
    // As peças de time ficam cada uma na sua metade: as minhas do lado de cá, as inimigas do lado de lá.
    if (team === 1) expect(a.mesh[i]).toBeLessThan(0);
    if (team === 2) expect(a.mesh[i]).toBeGreaterThan(0);
  }
  expect([...teams].sort()).toEqual([0, 1, 2]);
  // Determinístico, e o que a cena usa é montado uma vez por sessão.
  expect(buildAbyss().mesh).toEqual(a.mesh);
  expect(abyssAssets()).toBe(abyssAssets());
});

test('câmera parada: a cena inteira cabe na área livre e eu apareço à frente dos aliados, perto do meio', () => {
  const w = 1600;
  const h = 900;
  const area = [340, 130, 1570, 760] as const;
  const fit = fitAbyss(w, h, area);
  const pv = orbit(ABYSS_YAW, ABYSS_ELEV, fit.dist, w / h, 0.46, ABYSS_TARGET);
  for (const [x, y, z] of ABYSS_BOUNDS) {
    const [px, py] = toScreen(pv, fit.shift, w, h, x, y, z);
    expect(px).toBeGreaterThanOrEqual(area[0] - 1);
    expect(px).toBeLessThanOrEqual(area[2] + 1);
    expect(py).toBeGreaterThanOrEqual(area[1] - 1);
    expect(py).toBeLessThanOrEqual(area[3] + 1);
  }
  // A minha base fica à esquerda e a inimiga à direita; o meu ponto é o mais à direita do time.
  const at = (x: number, z: number) => toScreen(pv, fit.shift, w, h, x, 0, z);
  expect(at(-BASE_X, 0)[0]).toBeLessThan(at(BASE_X, 0)[0]);
  const xs = abyssSpots(5, 0).map(([x, z]) => at(x, z)[0]);
  expect(Math.max(...xs)).toBe(xs[0]);
});

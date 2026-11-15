import { expect, test } from 'vitest';
import { arenaAssets, arenaPinTimes, arenaSpots, ARENA_BOUNDS, ARENA_ELEV, ARENA_MESH_STRIDE, ARENA_SPRITE_STRIDE, ARENA_TARGET, ARENA_YAW, buildArena, DAIS_R, FLOOR_R, MAX_TEAMS, pedestalRadius, RING_R } from './arena';
import { fitArena } from './arenaScene';
import { orbit, toScreen } from './camera';

const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);

test('times: o meu no centro e os outros por igual no anel, sem se tocarem, para duplas (8), trios (6) e qualquer número', () => {
  for (const [teams, mine] of [[8, 4], [6, 0], [6, 5], [2, 1], [3, 0], [12, 7], [16, 2]] as const) {
    const spots = arenaSpots(teams, mine);
    expect(spots).toHaveLength(teams);
    expect(spots[mine]).toEqual([0, 0]);
    const ring = spots.filter((_, i) => i !== mine);
    const r = pedestalRadius(ring.length);
    for (const p of ring) {
      expect(Math.hypot(p[0], p[1])).toBeCloseTo(RING_R, 3);
      // Dentro do piso e fora do tablado do centro.
      expect(Math.hypot(p[0], p[1]) + r).toBeLessThan(FLOOR_R);
      expect(Math.hypot(p[0], p[1]) - r).toBeGreaterThan(DAIS_R);
    }
    // Pedestais vizinhos não se encostam, e o vão entre eles é o mesmo em toda a volta.
    const gaps = ring.map((p, i) => dist(p, ring[(i + 1) % ring.length]!));
    if (ring.length > 1) {
      expect(Math.min(...gaps)).toBeGreaterThan(r * 2);
      expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.5);
    }
  }
  // Sem o meu time na lista (não estou em nenhum): todos no anel, ninguém no centro.
  const all = arenaSpots(8, -1);
  expect(new Set(all.map((p) => p.join())).size).toBe(8);
  expect(all.every((p) => Math.hypot(p[0], p[1]) > DAIS_R)).toBe(true);
  expect(arenaSpots(1, 0)).toEqual([[0, 0]]);
  expect(arenaSpots(0, -1)).toEqual([]);
});

test('os times caem um a um depois de a arena subir, o meu por último, e tudo cabe na entrada', () => {
  for (const [teams, mine] of [[8, 4], [6, 0], [16, 3], [2, 0]] as const) {
    const times = arenaPinTimes(teams, mine);
    expect(times).toHaveLength(teams);
    expect(Math.max(...times)).toBe(times[mine]);
    expect(new Set(times).size).toBe(teams);
    expect(Math.min(...times)).toBeGreaterThanOrEqual(2);
    // A grade espera 3,8 s pela cena: a queda do último time (0,55 s) já terminou.
    expect(times[mine]! + 0.55).toBeLessThanOrEqual(3.8);
  }
  expect(arenaPinTimes(1, 0)).toHaveLength(1);
});

test('peças: buffers inteiros, sem número inválido, normais unitárias, um pedestal por time do anel, sempre iguais e montadas uma vez por formato', () => {
  const duo = buildArena(8, 4);
  const trio = buildArena(6, 0);
  for (const a of [duo, trio]) {
    expect(a.mesh.length % (ARENA_MESH_STRIDE * 3)).toBe(0);
    expect(a.sprites.length % ARENA_SPRITE_STRIDE).toBe(0);
    expect(a.mesh.length).toBeGreaterThan(ARENA_MESH_STRIDE * 3 * 500);
    expect(a.mesh.every(Number.isFinite)).toBe(true);
    expect(a.sprites.every(Number.isFinite)).toBe(true);
    for (let i = 0; i < a.mesh.length; i += ARENA_MESH_STRIDE) expect(Math.hypot(a.mesh[i + 3]!, a.mesh[i + 4]!, a.mesh[i + 5]!)).toBeCloseTo(1, 4);
  }
  // Sete pedestais nas duplas, cinco nos trios: 6 facetas de 3 triângulos cada.
  expect(duo.mesh.length - trio.mesh.length).toBe(2 * 6 * 3 * 3 * ARENA_MESH_STRIDE);
  // Bandeiras (tipo 3): a cor guarda o índice de um time que existe.
  for (const [a, teams] of [[duo, 8], [trio, 6]] as const) {
    const flags = new Set<number>();
    for (let i = 0; i < a.mesh.length; i += ARENA_MESH_STRIDE) if (a.mesh[i + 10] === 3) flags.add(a.mesh[i + 6]!);
    expect([...flags].sort((x, y) => x - y)).toEqual(Array.from({ length: teams }, (_, i) => i));
  }
  // Times demais: as bandeiras ficam dentro do que o shader conhece.
  const many = buildArena(20, 0);
  for (let i = 0; i < many.mesh.length; i += ARENA_MESH_STRIDE) if (many.mesh[i + 10] === 3) expect(many.mesh[i + 6]).toBeLessThan(MAX_TEAMS);
  expect(buildArena(8, 4).mesh).toEqual(duo.mesh);
  expect(arenaAssets(8, 4)).toBe(arenaAssets(8, 2));
  expect(arenaAssets(6, 0)).not.toBe(arenaAssets(8, 4));
});

test('câmera parada: a arena inteira cabe na área livre, com o meu time no meio dela e os outros em volta', () => {
  for (const [w, h, area] of [[1600, 900, [340, 130, 1260, 760]], [1280, 720, [246, 120, 1034, 610]]] as const) {
    const fit = fitArena(w, h, area);
    const pv = orbit(ARENA_YAW, ARENA_ELEV, fit.dist, w / h, 0.46, ARENA_TARGET);
    for (const [x, y, z] of ARENA_BOUNDS) {
      const [px, py] = toScreen(pv, fit.shift, w, h, x, y, z);
      expect(px).toBeGreaterThanOrEqual(area[0] - 1);
      expect(px).toBeLessThanOrEqual(area[2] + 1);
      expect(py).toBeGreaterThanOrEqual(area[1] - 1);
      expect(py).toBeLessThanOrEqual(area[3] + 1);
    }
    for (const [teams, mine] of [[8, 4], [6, 0]] as const) {
      const at = arenaSpots(teams, mine).map(([x, z]) => toScreen(pv, fit.shift, w, h, x, 9, z));
      const xs = at.map((p) => p[0]);
      // O centro fica entre os pedestais, nos dois eixos.
      expect(at[mine]![0]).toBeGreaterThan(Math.min(...xs));
      expect(at[mine]![0]).toBeLessThan(Math.max(...xs));
      expect(Math.abs(at[mine]![0] - (area[0] + area[2]) / 2)).toBeLessThan((area[2] - area[0]) * 0.1);
      // Pedestais vizinhos ficam a mais de um retrato de distância na tela.
      const ring = at.filter((_, i) => i !== mine);
      for (let i = 0; i < ring.length; i++) for (let j = i + 1; j < ring.length; j++) expect(dist(ring[i]!, ring[j]!)).toBeGreaterThan(30);
    }
  }
});

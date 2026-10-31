// Só letras e números, sem acento: "Cho'Gath" vira "chogath", "Dr. Mundo" vira "drmundo".
const plain = (s: string) => s.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

/** Busca de campeão como no client: as letras da busca aparecem no nome nessa ordem, com pulos ("zean" acha Zilean). */
export function matchesName(query: string, name: string): boolean {
  const q = plain(query);
  let i = 0;
  for (const ch of plain(name)) if (ch === q[i]) i++;
  return i === q.length;
}

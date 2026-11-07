import { afterEach, expect, test } from 'vitest';
import { crestUrl } from './Rank';

afterEach(() => void delete (window as { __leagueOldRanks?: unknown }).__leagueOldRanks);

test('brasão do client; com o League Old Ranks instalado, os brasões antigos dele', () => {
  expect(crestUrl('GOLD')).toBe('/fe/lol-static-assets/images/ranked-mini-crests/gold.svg');
  expect(crestUrl('GOLD', 'emblem')).toBe('/fe/lol-static-assets/images/ranked-emblem/emblem-gold.png');
  (window as { __leagueOldRanks?: unknown }).__leagueOldRanks = 'https://plugins/League%20Old%20Ranks/index.js';
  expect(crestUrl('GOLD')).toBe('https://plugins/League%20Old%20Ranks/assets/full%20crests/gold.webp');
  expect(crestUrl('EMERALD', 'emblem')).toBe('https://plugins/League%20Old%20Ranks/assets/full%20crests/emerald.webp');
});

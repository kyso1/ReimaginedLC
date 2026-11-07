import { test } from 'node:test';
import assert from 'node:assert/strict';
import { match, parseTitle } from './update.mjs';

test('título: nome da skin, PBE marcado, anos e notas fora', () => {
  assert.deepEqual(parseTitle('Star Guardian Ahri Skin Spotlight - Pre-Release - PBE Preview - League of Legends'), { name: 'star guardian ahri', pre: true });
  assert.deepEqual(parseTitle('Santa Gragas (2014 VFX Update) Skin Spotlight League of Legends'), { name: 'santa gragas', pre: false });
  assert.deepEqual(parseTitle('Full - PROJECT: Yasuo League of Legends Skin Spotlight'), { name: 'project yasuo', pre: false });
  assert.equal(parseTitle('Chibi Spirit Blossom Ahri | Teamfight Tactics'), null);
});

test('vale o vídeo mais novo do lançamento; PBE só sem ele; base de fora', () => {
  const videos = [
    { id: 'pbe', title: 'Arcade Ahri Skin Spotlight - Pre-Release - PBE Preview - League of Legends' },
    { id: 'novo', title: 'Arcade Ahri (2020) Skin Spotlight - League of Legends' },
    { id: 'velho', title: 'Arcade Ahri Skin Spotlight - League of Legends' },
    { id: 'so-pbe', title: 'Sasquatch Nunu Skin Spotlight - Pre-Release - League of Legends' },
  ];
  const skins = [{ id: 103000, name: 'Ahri', isBase: true }, { id: 103017, name: 'Arcade Ahri' }, { id: 20003, name: 'Sasquatch Nunu & Willump' }, { id: 1, name: 'Sem Vídeo' }];
  assert.deepEqual(match(videos, skins), { 103017: 'novo', 20003: 'so-pbe' });
});

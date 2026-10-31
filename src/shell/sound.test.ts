import { expect, test } from 'vitest';
import { clickSound, homeMusicVolume, sfxVolume } from './sound';

const el = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild!.querySelector('span') ?? host.firstElementChild!;
};

test('clique: principal toca confirmar, abas e chips tocam aba, o resto clique comum; desabilitado não toca', () => {
  expect(clickSound(el('<button data-variant="primary"><span>Jogar</span></button>'))).toBe('confirm');
  expect(clickSound(el('<button role="tab">Skins</button>'))).toBe('tab');
  expect(clickSound(el('<button class="rlc-queue-chip">Normal</button>'))).toBe('tab');
  expect(clickSound(el('<button>Voltar</button>'))).toBe('click');
  expect(clickSound(el('<button disabled>Voltar</button>'))).toBeNull();
  expect(clickSound(el('<div>texto</div>'))).toBeNull();
});

test('música da tela inicial segue o som do client: música e ambiente do client ligados, volume da música', () => {
  const on = { masterSoundEnabled: true, musicEnabled: true, clientAmbienceMusicEnabled: true, musicVolume: 40 };
  expect(homeMusicVolume(on)).toBeCloseTo(0.4);
  expect(homeMusicVolume({ ...on, masterVolume: 50 })).toBeCloseTo(0.2);
  expect(homeMusicVolume({ ...on, musicEnabled: false })).toBe(0);
  expect(homeMusicVolume({ ...on, clientAmbienceMusicEnabled: false })).toBe(0);
  expect(homeMusicVolume({ ...on, masterSoundEnabled: false })).toBe(0);
  // Sem a configuração lida ainda, nada toca.
  expect(homeMusicVolume(null)).toBe(0);
});

test('efeitos (cliques, aviso de mensagem) seguem o som do client: canal de efeitos e volume geral', () => {
  const on = { masterSoundEnabled: true, sfxEnabled: true, sfxVolume: 21 };
  expect(sfxVolume(on)).toBeCloseTo(0.21);
  expect(sfxVolume({ ...on, masterVolume: 50 })).toBeCloseTo(0.105);
  expect(sfxVolume({ ...on, sfxEnabled: false })).toBe(0);
  expect(sfxVolume({ ...on, masterSoundEnabled: false })).toBe(0);
  // Música desligada não cala os efeitos.
  expect(sfxVolume({ ...on, musicEnabled: false })).toBeCloseTo(0.21);
  expect(sfxVolume(null)).toBe(0);
});

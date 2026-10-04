const TEXTS = {
  'pt-BR': {
    play: 'Jogar',
    patchNotes: 'Notas do patch',
    home: 'Início',
    originalClient: 'Client original',
    layerOn: 'ReimaginedLC ligado',
    layerOff: 'ReimaginedLC desligado',
    startFailed: 'ReimaginedLC falhou ao iniciar',
    screenFailed: 'ReimaginedLC: erro na tela, voltando ao client original',
    themeInvalid: 'Tema inválido',
    toggleLayer: 'ligar/desligar',
    themeAction: 'tema',
    openFailed: 'Não foi possível abrir as notas do patch',
  },
  'en-US': {
    play: 'Play',
    patchNotes: 'Patch notes',
    home: 'Home',
    originalClient: 'Original client',
    layerOn: 'ReimaginedLC on',
    layerOff: 'ReimaginedLC off',
    startFailed: 'ReimaginedLC failed to start',
    screenFailed: 'ReimaginedLC: screen error, back to the original client',
    themeInvalid: 'Invalid theme',
    toggleLayer: 'toggle',
    themeAction: 'theme',
    openFailed: 'Could not open the patch notes',
  },
} as const;

export type TextKey = keyof (typeof TEXTS)['en-US'];

let current: keyof typeof TEXTS = 'en-US';

/** Recebe o locale do client (`pt_BR`, `en_US`...). O que não for português cai em inglês. */
export function setLocale(locale: string): void {
  current = locale.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
}

export const t = (key: TextKey): string => TEXTS[current][key];

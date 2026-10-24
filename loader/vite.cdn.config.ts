import { mergeConfig, type ConfigEnv, type UserConfig } from 'vite';
import main from '../vite.config';

// Bundle do CDN: o mesmo build do app, mas num arquivo só (sem chunks), porque o carregador importa os bytes
// verificados por blob: e um blob não resolve imports relativos. `npm run build:cdn` → dist-cdn/ReimaginedLC/.
export default (env: ConfigEnv): UserConfig =>
  mergeConfig(typeof main === 'function' ? main(env) : main, {
    build: { outDir: 'dist-cdn/ReimaginedLC', rolldownOptions: { output: { codeSplitting: false } } },
  });

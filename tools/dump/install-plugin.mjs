import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fail } from './lcu.mjs';

const PENGU_DIR = process.env.PENGU_DIR ?? 'C:\\Program Files\\Pengu Loader';
const TARGET = join(PENGU_DIR, 'plugins', 'zz-rlc-dump');

try {
  if (!existsSync(join(PENGU_DIR, 'plugins'))) throw new Error(`pasta de plugins do Pengu não encontrada em ${PENGU_DIR}. Defina PENGU_DIR.`);
  if (process.argv.includes('--remove')) {
    rmSync(TARGET, { recursive: true, force: true });
    console.log(`removido: ${TARGET}`);
  } else {
    cpSync('tools/dump/pengu-plugin', TARGET, { recursive: true });
    console.log(`instalado: ${TARGET}`);
  }
} catch (e) {
  if (e.code === 'EPERM' || e.code === 'EACCES') {
    fail(new Error(`sem permissão para escrever em ${TARGET}. Rode o terminal como administrador.`));
  }
  fail(e);
}

import { supports } from '../lcu/capabilities';
import { request } from '../lcu/request';

/**
 * Dodge sem fechar o client: pede ao servidor o mesmo `quitV2` do teambuilder que o client manda ao fechar no meio da
 * seleção. Não é atalho de penalidade: o servidor aplica o dodge igual (tempo de espera e, na ranqueada, PdL).
 */
export const DODGE_PATH = `/lol-login/v1/session/invoke?destination=lcdsServiceProxy&method=call&args=${encodeURIComponent(JSON.stringify(['', 'teambuilder-draft', 'quitV2', '']))}`;

export const dodge = () => request('POST', DODGE_PATH);

/**
 * O client 16.21 tirou o `/lol-login/v1/session/invoke`: sem ele não há como sair da seleção sem fechar o client, então
 * o botão some (e a opção avisa) em vez de falhar no meio da seleção. Volta sozinho se a Riot devolver o endpoint.
 */
export const dodgeAvailable = () => supports('POST', '/lol-login/v1/session/invoke');

# Subprojeto 2a: janela, lobby, fila e aceite

Data: 2026-10-05
Status: aguardando revisão
Spec geral: `2026-10-03-reimaginedlc-design.md`. Fundação: `2026-10-04-fundacao-design.md` e `docs/fundacao/REPORT.md`.

## Objetivo

Com a camada ligada, a pessoa controla a janela, recebe convites, escolhe um modo, monta o grupo ou a sala personalizada, entra na fila e aceita a partida sem ver a interface da Riot. A seleção de campeões e o pós-jogo ficam para o subprojeto 2b; até lá, a partir de `ChampSelect` aparece o client original.

Sucesso significa: no client real, os itens da seção "Verificação no client" passam, e nenhum caminho deixa o client inutilizável.

## Divisão do subprojeto 2

O subprojeto 2 da spec geral foi dividido em dois, cada um com spec, plano e revisão próprios:

| Parte | Escopo |
|---|---|
| 2a | Controles de janela, convites recebidos, tela de modos, lobby Palco, sala personalizada, fila, aceite de partida |
| 2b | Seleção de campeões no layout Cinemático, pós-jogo, gravação de uma partida completa, camada ligada por padrão |

A camada continua desligada por padrão até o fim do 2b. Ligar por padrão sem a seleção de campeões faria a interface trocar no meio do fluxo.

## Escolhas visuais

As prévias estão em `docs/mockups/2a-jogar-fluxo.html`, `docs/mockups/2a-fila-aceite.html` e `docs/mockups/2a-personalizada.html`.

| Peça | Escolha |
|---|---|
| Escolha da fila | Tela de modos: sobreposição em tela cheia com um cartão por mapa e as filas do mapa embaixo. Abre pelo Jogar da tela inicial e pelo nome da fila na barra do lobby |
| Fila | A barra flutuante do Palco vira cronômetro: tempo, estimativa e Cancelar |
| Aceite de partida | Véu escuro sobre qualquer tela, anel de contagem regressiva, Aceitar e Recusar |
| Sala personalizada | Palco em duas faixas: time azul em cima, time vermelho embaixo, meia altura por jogador |
| Convite recebido | Cartão no canto superior direito, sobre qualquer tela, com Aceitar e Recusar |
| Controles de janela | Faixa de arraste de 16 px no topo, minimizar e fechar à direita |

## Arquitetura

A abordagem estende a fundação sem reescrevê-la.

- **Stores:** um `createStore` por endpoint novo, no padrão existente (`GET` inicial, depois eventos do socket, sem polling).
- **Ações:** `lcu.request(method, path, body?)`, uma função única para chamadas HTTP à LCU. Em resposta de erro, mostra um `Toast` com a mensagem da LCU e rejeita; quem chama não altera estado local. A interface muda apenas quando o evento do socket confirma.
- **Roteador:** `screenFor` passa a devolver `home`, `lobby` ou `null`.
- **Sobreposições:** uma camada do shell acima da tela atual, independente da fase: tela de modos, aceite de partida, cartões de convite, confirmação de fechar.

### Roteamento por fase

| Fase | Tela | Sobreposição automática |
|---|---|---|
| `None` | `home` | |
| `Lobby` | `lobby` | |
| `Matchmaking` | `lobby`, barra em modo cronômetro | |
| `ReadyCheck` | `lobby` | aceite de partida |
| `ChampSelect` e seguintes | client original (até o 2b) | |
| desconhecida ou store indisponível | client original | |

O trilho mostra Início, Lobby (apenas quando existe lobby) e Client original. Os cartões de convite aparecem em qualquer tela nossa.

### Stores novos

| Store | Endpoint | Atualização |
|---|---|---|
| `lobby` | `/lol-lobby/v2/lobby` | eventos |
| `search` | `/lol-matchmaking/v1/search` | eventos |
| `readyCheck` | `/lol-matchmaking/v1/ready-check` | eventos |
| `invitations` | `/lol-lobby/v2/received-invitations` | eventos |
| `queues` | `/lol-game-queues/v1/queues` | eventos; a interface usa só filas com `queueAvailability` igual a `Available` |
| `friends` | `/lol-chat/v1/friends` | eventos |
| `customGames` | `/lol-lobby/v1/custom-games` | sem eventos: `GET` ao abrir a lista e ao tocar em atualizar, depois de `POST /lol-lobby/v1/custom-games/refresh` |

Perfil de cada membro do lobby (`/lol-summoner/v1/summoner-profile?puuid=`) é buscado sob demanda por coluna, com cache em memória por `puuid` durante a sessão.

Os tipos vêm de `src/lcu/types.d.ts`, gerado no subprojeto 0.

## Shell e janela

- **Arraste:** faixa de 16 px no topo da camada com `-webkit-app-region: drag`; botões dentro dela com `no-drag`. Não se sabe se o CEF do client respeita a propriedade. A primeira tarefa do plano verifica no client. Se não funcionar, a camada passa a começar 16 px abaixo do topo, a raiz da Riot deixa de ser escondida (`hideRiot` fica `false`) e a faixa de título dela, visível acima da camada, faz o arraste. Custo conhecido: perde-se a economia de cerca de 25 pontos de CPU medida no subprojeto 1, ainda dentro do orçamento.
- **Minimizar:** `POST /riotclient/ux-minimize`.
- **Fechar:** confirmação nossa ("Fechar o League of Legends?"), depois `POST /process-control/v1/process/quit`, a mesma rota do X da Riot.
- **Convites recebidos:** cada item de `invitations` com estado `Pending` vira um cartão com nome de quem convidou e fila. Aceitar: `POST /lol-lobby/v2/received-invitations/{id}/accept`. Recusar: `.../decline`.
- **Aceite de partida:** ao entrar em `ReadyCheck`, se a janela estiver minimizada ou sem foco, chama `POST /riotclient/ux-show` e `POST /riotclient/ux-flash`.

## Telas

### Tela inicial

Jogar abre a tela de modos em vez de desligar a camada. As notas do patch continuam como estão (link bloqueado, pendência herdada do subprojeto 1).

### Tela de modos

- Cartões por grupo, no agrupamento que a própria Riot usa (`gameSelectModeGroup`): Summoner's Rift (`kSummonersRift`), ARAM (`kARAM`), TFT (`kTeamfightTactics`), Outros modos (`kAlternativeLeagueGameModes`, onde ficam Arena e eventos) e Personalizada. Entram filas com `queueAvailability` `Available`, `isVisible` verdadeiro e `gameSelectCategory` diferente de `CreateCustom`. Grupo desconhecido entra em Outros modos. Grupo sem fila não aparece.
- Ao escolher um mapa, as filas dele aparecem embaixo. A Ferramenta de Treino (fila 3140, `gameSelectCategory` `kTraining`) aparece no grupo Summoner's Rift.
- Confirmar: `POST /lol-lobby/v2/lobby { queueId }`. A mesma chamada cria o lobby ou troca a fila de um lobby existente.
- A última fila confirmada fica no `DataStore` (`rlc.lastQueue`) e vem selecionada na próxima abertura.
- Personalizada abre a lista de salas e a criação.

### Lista de salas e criação

- Lista: nome, mapa, jogadores, cadeado quando há senha. Entrar: `POST /lol-lobby/v1/custom-games/{id}/join`, com `{ password }` quando a sala tem senha.
- Criar: nome, senha opcional, modo, tamanho do time, política de espectadores. O modo é uma das filas com `gameSelectCategory` `CreateCustom` (cada uma já define mapa, modo de jogo e tipo de escolha, por exemplo 3100 "SR Blind Pick Custom"). Envia `POST /lol-lobby/v2/lobby` com `queueId` da fila escolhida e `customGameLobby` (`lobbyName`, `lobbyPassword`, `configuration` com `gameMode` e `mapId` da fila, `teamSize` de 1 a 5, `spectatorPolicy` e `mutators: { id: gameTypeConfig.id }` da fila).

### Lobby Palco

- Uma coluna por vaga (`maxLobbySize`).
- Fundo da coluna: `backgroundSkinId` do perfil do membro. Imagem em `/lol-game-data/assets/v1/champion-splashes/{floor(skinId / 1000)}/{skinId}.jpg`. Sem perfil, sem skin ou com falha de carregamento: gradiente do tema.
- Coluna mostra nome e posições escolhidas. No jogador local, clicar abre a escolha de posições quando a fila usa posições (`showPositionSelector` em `gameConfig`): `PUT /lol-lobby/v2/lobby/members/localMember/position-preferences { firstPreference, secondPreference }`.
- Vaga vazia: "+ convidar" abre a lista de amigos online (`friends` com disponibilidade diferente de `offline`). Convite: `POST /lol-lobby/v2/lobby/invitations [{ toSummonerId }]`. Aparece para o líder e para quem tem permissão de convidar.
- Menu ⋯ do líder em cada outro membro: promover (`POST .../members/{summonerId}/promote`), expulsar (`.../kick`), permitir convite (`.../grant-invite`) e revogar (`.../revoke-invite`).
- Barra flutuante:
  - nome da fila, que reabre a tela de modos (só o líder);
  - lobby aberto ou fechado, para o líder (`PUT /lol-lobby/v2/lobby/partyType` com `"open"` ou `"closed"`);
  - Encontrar partida (`POST /lol-lobby/v2/lobby/matchmaking/search`, só o líder);
  - Sair (`DELETE /lol-lobby/v2/lobby`);
  - em `Matchmaking`: tempo na fila, estimativa e Cancelar (`DELETE /lol-lobby/v2/lobby/matchmaking/search`, só o líder).
- Quem não é líder vê o estado sem os controles de fila e busca.
- Erros de busca (`search.errors`, como penalidade de fila): faixa na barra com a mensagem e o tempo restante.

### Sala personalizada

- Palco em duas faixas, time azul em cima e vermelho embaixo, uma coluna por vaga (`teamSize`).
- Clicar numa vaga vazia do outro time troca de time: `PUT /lol-lobby/v2/lobby/team/{team}`.
- Vaga vazia, para o líder: "+ bot" abre campeão e dificuldade, a partir de `/lol-lobby/v2/lobby/custom/available-bots`. Adiciona com `POST /lol-lobby/v1/lobby/custom/bots { championId, botDifficulty, teamId }`. O ⋯ de um bot tem só remover (`DELETE /lol-lobby/v1/lobby/custom/bots/{summonerInternalName}/{botUuid}/{teamId}`).
- Menu ⋯ dos jogadores humanos igual ao do Palco.
- Barra: nome da sala, mapa e modo, número de espectadores, convidar, Sair e Iniciar (`POST /lol-lobby/v1/lobby/custom/start-champ-select`, só o líder).

### Aceite de partida

- Anel com o tempo restante a partir de `readyCheck.timer` (segundos decorridos de um total de 10).
- A API não informa quem já aceitou (só `playerResponse` do jogador local e `declinerIds`), então não há indicador por jogador.
- Com `suppressUx` verdadeiro (caso da Ferramenta de Treino e de filas que o client aceita sozinho), a sobreposição não aparece.
- Aceitar: `POST /lol-matchmaking/v1/ready-check/accept`. Recusar: `POST /lol-matchmaking/v1/ready-check/decline`.
- Depois de responder, os botões somem e fica o estado ("Aceito, aguardando os outros" ou "Recusado").

### Estrutura de arquivos

- `src/lcu/`: stores novos e `request`.
- `src/shell/WindowBar.tsx`: faixa de arraste, minimizar, fechar.
- `src/shell/overlays/`: aceite, cartões de convite, confirmação de fechar.
- `src/screens/modes/`: tela de modos, lista de salas, criação de sala.
- `src/screens/lobby/`: Palco, sala personalizada, escolha de posições, convite de amigos, menu do líder.

Componentes de `ui/` são reaproveitados; peças novas leem apenas variáveis CSS do tema.

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Ação retorna erro | `Toast` com a mensagem da LCU, estado inalterado |
| Erro de busca | Faixa na barra com mensagem e tempo restante |
| Exceção ao renderizar uma tela ou a tela de modos | Error boundary existente: a camada se desliga, `Toast` |
| Exceção na sobreposição de aceite | A camada se desliga na hora e o aceite da Riot aparece |
| Store de uma fase `unavailable` | Essa fase cai no client original |
| Splash não carrega | Gradiente do tema |
| `ux-minimize` ou `quit` falham | `Toast`; a janela fica como está |

Texto externo (nomes, nomes de sala) é sempre inserido como texto.

## Testes

- **Vitest:** roteador com as fases novas; `request` (sucesso, erro com mensagem, erro sem corpo); stores novos, incluindo `customGames` sem eventos; agrupamento de filas por mapa; montagem do corpo de criação de sala; um teste por tela com dados fixos: Palco com membros e vagas vazias, líder e não líder, busca com cronômetro e erro, aceite antes e depois de responder, cartões de convite, sala personalizada com bots e troca de time; fallback da sobreposição de aceite (exceção desliga a camada).
- **Dados fixos:** fixtures sintéticas pequenas, escritas à mão a partir dos tipos gerados, com nomes neutros (`Fulano`, `Zeca`) e UUIDs sintéticos.
- **LCU simulada:** continua reproduzindo a sessão gravada no subprojeto 0, que passa por `Lobby`, `Matchmaking` e `ReadyCheck`. Gravação nova fica para o 2b.

## Verificação no client

Feita por quem executa o plano, com o client aberto:

1. Arraste da janela pela faixa (primeira tarefa; decide entre o caminho principal e o alternativo).
2. Minimizar; fechar com confirmação (cancelar a confirmação; confirmar só no fim da verificação).
3. Tela de modos: criar lobby da Ferramenta de Treino e de uma fila normal; trocar de fila.
4. Escolha de posições numa fila ranqueada.
5. Encontrar partida e Cancelar numa fila normal.
6. Sala personalizada: criar, adicionar e remover bot, trocar de time, iniciar (a seleção de campeões aparece no client original).
7. Lista de salas abre e atualiza.
8. Em `ChampSelect`, a camada se oculta e o client original fica utilizável.

Feita pelo dono, porque depende de outras pessoas ou de uma partida real: convite recebido de um amigo; aceite real numa fila; funções de líder com outro membro no grupo.

## Execução

- Implementação feita diretamente na sessão principal, sem subagente por tarefa, em uma branch `fluxo-2a` com um commit por tarefa.
- Uma revisão do branch inteiro por um subagente ao final. Custo estimado de 100 a 200 mil tokens, uma execução.
- Correções apenas das conclusões aprovadas pelo dono.

## Fora de escopo do 2a

- Seleção de campeões, seletor de skins e pós-jogo (2b).
- Notificações gerais do jogador e pedidos de amizade (subprojetos 3 e 4).
- Notas do patch dentro da camada.
- Camada ligada por padrão.

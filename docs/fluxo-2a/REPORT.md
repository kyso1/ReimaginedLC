# Relatório do subprojeto 2a: janela, lobby, fila e aceite

Client 16.19.823.0722, Pengu Loader 1.1.6, 2026-10-05.

A verificação foi dirigida por dentro do client, com um plugin de diagnóstico descartável que recebia comandos de uma ponte local (127.0.0.1), clicava nos botões da camada e devolvia o estado do DOM e da LCU. O arraste e o minimizar foram testados com o mouse real, movido pelo sistema operacional. O plugin e a ponte foram removidos ao fim; o client ficou com a camada desligada e sem lobby.

## Verificação

| # | Item | Resultado | Observação |
|---|---|---|---|
| 1 | Arraste da janela | ok | A janela arrasta por toda a faixa do topo (cerca de 45 px CSS), não só pela nossa faixa de 16 px: o arraste é nativo do client ou de um ouvinte de captura da Riot, e não depende do DOM. Clique simples chega aos nossos controles. O caminho alternativo da spec não foi necessário. |
| 2 | Minimizar; fechar com confirmação | ok | Minimizar com clique real. Fechar abre a confirmação; cancelar fecha o diálogo. A confirmação final (encerrar o client) não foi executada. |
| 3 | Tela de modos: Ferramenta de Treino, fila normal, troca de fila | ok, após correções | Ver "Defeitos encontrados", itens 1 a 3. |
| 4 | Posições numa ranqueada | ok, após correção | Topo e Suporte gravados. Ver item 8. |
| 5 | Encontrar partida e Cancelar numa normal | ok, após correção | Ver item 7. Fila cancelada em segundos. |
| 6 | Sala personalizada: criar, bot, trocar de time, iniciar | ok, após correções | Ver itens 4 a 6. Iniciar levou à seleção de campeões; ela foi cancelada pela API. |
| 7 | Lista de salas abre e atualiza | ok, parcial | A lista abre e carrega as salas reais. O botão Atualizar não foi clicado no client (coberto por teste). |
| 8 | Em `ChampSelect`, a camada se oculta e o client original fica utilizável | ok | Camada oculta, raiz da Riot visível; ao sair, a camada voltou. |

Itens que dependem do dono (outra pessoa ou partida real), não verificados:

- convite recebido de um amigo (cartão, aceitar, recusar);
- aceite de partida real numa fila (a Ferramenta de Treino manda `suppressUx: true`, então a sobreposição não aparece nela, como previsto);
- funções de líder com outro membro no grupo (promover, expulsar, permitir convite).

## Defeitos encontrados no client e corrigidos

Todos com teste que falhou antes da correção.

1. **Ferramenta de Treino fora de Summoner's Rift.** A fila 3140 vem com `gameSelectModeGroup: kAlternativeLeagueGameModes`. Agora `gameSelectCategory: kTraining` entra em Summoner's Rift, como a spec pede.
2. **Fila personalizada recusa `{ queueId }`.** Criar o lobby da 3140 só com `queueId` responde `INVALID_REQUEST`. Filas `isCustom` passam a usar o mesmo corpo da criação de sala (`customGameLobby` com modo, mapa e mutador da fila).
3. **Fila sem nome.** Uma fila disponível e visível tem `name` vazio; ela não aparece mais.
4. **Nomes vazios.** Desde o Riot ID, `summonerName` dos membros chega vazio. O nome vem de `/lol-summoner/v1/summoners-by-puuid-cached/{puuid}` (`gameName`), com cache, nas colunas e nos convites.
5. **Times da sala.** `teamId` dos membros chega 0 em `customTeam100` e `customTeam200`; o time passa a ser a lista em que o membro está. A troca de time é `POST /lol-lobby/v2/lobby/team/TEAM1` ou `TEAM2` (`100`, `200`, `one`, `two` e outros respondem `INVALID_REQUEST`).
6. **Bots.** `POST /lol-lobby/v1/lobby/custom/bots` exige os cinco campos: `teamId` como texto (`"100"`), uma `position` válida (`"MIDDLE"`; vazio e `UNSELECTED` são recusados) e `botUuid: ""`. O bot criado chega sem `summonerInternalName`; a remoção funciona com qualquer texto no lugar (`bot`). `available-bots` traz o id no campo `name`; o nome vem do `champion-summary.json`. As dificuldades reais são `RSINTRO`, `RSBEGINNER`, `RSINTERMEDIATE`, agora traduzidas.
7. **Fila normal sem a fase `Matchmaking`.** Na fila normal a fase do gameflow continua `Lobby` enquanto procura; `Matchmaking` só apareceu na Ferramenta de Treino. A barra passa a seguir `search.isCurrentlyInQueue`.
8. **Escolha de posições.** Dois cliques antes do próximo desenho se sobrescreviam (estado antigo na função). Corrigido com atualização funcional.
9. **Splash.** A rota `/lol-game-data/assets/v1/champion-splashes/{campeão}/{skin}.jpg` não carrega no client. A splash vem de `skins[].splashPath` em `/lol-game-data/assets/v1/champions/{id}.json`, com cache por campeão.

## Desempenho

Uma medição de 60 s por cenário, no lobby de uma fila normal, mesma sessão do client, 12 núcleos lógicos. Arquivos em `docs/dump/baseline/fluxo-2a-lobby-*.json`.

| Cenário | Memória de trabalho média (MB) | CPU (% de um núcleo) |
|---|---:|---:|
| Camada desligada | 2 079,6 | 164,77 |
| Camada ligada, Riot escondida | 2 131,3 | 129,80 |

Diferença com a camada ligada: +51,7 MB e −35 pontos de CPU. Dentro do orçamento (300 MB, 15 pontos). Os valores absolutos são maiores que os do subprojeto 1 porque o client já tinha passado por muitos reinícios da interface nesta sessão; só a diferença entre os dois cenários é comparável. Uma amostra por cenário.

## Desvios em relação à spec

- A troca de time é `POST` com `TEAM1`/`TEAM2`, não `PUT /team/{team}`.
- O arraste vale para toda a faixa do topo, não só para os 16 px declarados.
- A sobreposição de aceite não tem indicador por jogador (a API não informa quem aceitou), como já registrado na spec.
- O item Início do trilho indica onde se está; a navegação segue a fase do gameflow.

## Pendências

1. Verificações do dono listadas acima.
2. O primeiro evento de uma busca pode trazer um `timeInQueue` antigo; o cronômetro chegou a voltar de 0:17 para 0:10 ao receber o valor certo.
3. Bots não têm splash na coluna (poderiam usar a splash base do campeão).
4. Herdadas: notas do patch não abrem (`window.open` bloqueado); textos da barra de comandos em inglês para `pt_BR`.

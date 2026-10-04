# Relatório do subprojeto 1: fundação

Client 16.19.823.0722, Pengu Loader 1.1.6, 2026-10-04.

## Marco

A verificação foi dirigida por dentro do client, com um plugin de diagnóstico descartável que dispara o evento do atalho, clica nos botões da camada e reporta o estado do DOM. Teclas sintéticas enviadas pelo sistema operacional não chegaram à página (a janela do client não assumiu o primeiro plano), então dois itens ficam para confirmação manual.

| # | Item | Resultado | Observação |
|---|---|---|---|
| 1 | Ao carregar, o client original aparece e não há `Toast` de erro | ok | Camada desligada por padrão; nenhum erro capturado. |
| 2 | O atalho liga a camada: tela inicial com fundo do Vidro, Jogar e notas do patch | ok, com ressalva | Ok pelo evento disparado dentro da página, que chegou ao listener registrado em `init`. Falta confirmar com a tecla física. |
| 3 | Barra de comandos: ligar/desligar e um por tema; troca de tema ao vivo | não verificado | A barra do Pengu não pôde ser acionada sem teclado real. A troca de tema foi verificada por configuração e recarga: Vidro e Editorial renderizam corretamente (cores, cantos, transição, fundo presente ou ausente). A troca ao vivo está coberta por teste automatizado. |
| 4 | "Notas do patch" abre a página da Riot | falhou | `window.open` é bloqueado no client. O `Toast` "Could not open the patch notes" aparece, como previsto para a falha. |
| 5 | Jogar desliga a camada e o client original fica utilizável | ok | |
| 6 | Em fase sem tela nossa a camada se oculta, e volta em `None` | ok | Lobby da Ferramenta de Treino criado pela API com a camada ligada: a camada se ocultou e a interface da Riot ficou visível; ao sair do lobby, a camada voltou. |
| 7 | O estado ligado ou desligado persiste entre recarregamentos | ok | |
| 8 | O elemento raiz da Riot é `#rcp-fe-viewport-root` | ok | Confirmado. É um `section`, filho direto do `body`. |
| 9 | Com a Riot escondida por 2 minutos, o client original responde ao desligar | não verificado | Cada medição manteve a Riot escondida por mais de 2 minutos e a restauração funcionou; a navegação manual pelas abas não foi feita. |

Os textos apareceram em inglês porque o client deste computador está em `en_US`.

## Defeito encontrado e corrigido no client

Cerca de 0,6 s após o carregamento, `start()` anexa `#rlc-root` ao `body`. Cerca de 1,2 s, a inicialização do client substitui os filhos do `body`: um clone do nosso elemento é inserido e o original, onde o Preact desenha, é removido. O elemento raiz da Riot só aparece por volta de 1,3 s.

Antes da correção, ligar a camada escondia a interface da Riot e desenhava a nossa num elemento fora da página: client em branco. Com a camada já ligada ao carregar, ficava na tela um clone estático e a Riot não era escondida.

Correção (`d0963ca`): `start()` observa os filhos do `body`, remove clones, reanexa o elemento verdadeiro e sinaliza ao `App` quando o elemento raiz da Riot aparece ou é trocado, para a visibilidade ser ressincronizada. Verificado no client em todos os cenários da tabela acima.

## Desempenho

Uma medição de 60 s por cenário, client ocioso na tela inicial, 12 núcleos lógicos.

| Cenário | Memória de trabalho média (MB) | CPU (% de um núcleo) | Diferença para "camada desligada" |
|---|---:|---:|---|
| Sem plugins (subprojeto 0) | 1 209,6 | 156,64 | |
| Camada desligada | 1 250,4 | 153,65 | |
| Camada ligada, Riot visível | 1 260,9 | 159,52 | +10,5 MB, +5,9 pontos |
| Camada ligada, Riot escondida | 1 234,6 | 128,85 | −15,8 MB, −24,8 pontos |

Orçamento: até 300 MB e até 15 pontos de CPU acima da linha "camada desligada". Dentro do orçamento nos dois cenários com a camada ligada, com folga de mais de 280 MB.

As medições usaram o fundo em imagem do tema Vidro; um fundo em vídeo, que é o caso previsto no orçamento da spec, ainda não foi medido.

Esconder a interface da Riot reduz o custo: com ela em `visibility: hidden`, a CPU ficou cerca de 25 pontos abaixo da camada desligada. Decisão: `rlc.hideRiot` fica `true` por padrão. Ressalva: é uma amostra por cenário, sem repetição; a diferença de 25 pontos é grande o bastante para não ser ruído, mas o valor exato não deve ser tomado como preciso.

## Tamanho

`dist/ReimaginedLC/index.js`: 49,8 KB (16,8 KB com gzip). Temas: 3 manifestos, menos de 6 KB no total.

## Pendências e ajustes

1. **A camada cobre os controles de janela do client.** Com a camada ligada, os botões de minimizar, fechar e configurações e a área de arrastar a janela ficam escondidos. Também ficam escondidas as notificações da Riot, como convites de grupo. Hoje a saída é o atalho, Jogar ou "Client original". O shell precisa de controles de janela próprios e de uma região de arraste antes de a camada ficar ligada por padrão; entra no subprojeto 2.
2. **Notas do patch não abrem.** `window.open` é bloqueado. Não foi encontrada na API do client uma rota para abrir uma URL externa. Opções a avaliar: mostrar as notas num painel dentro da camada (como previsto na spec geral para a loja) ou localizar o mecanismo que a própria interface da Riot usa para links externos.
3. **Tecla física e barra de comandos não verificadas.** Confirmar manualmente `Ctrl+Shift+F12` e as ações "ReimaginedLC: ..." em `Ctrl+K`.
4. **Nomes das ações na barra de comandos saem em inglês** para clients em `pt_BR`, porque são registrados antes de o idioma ser conhecido.
5. **O validador de temas é rígido para autores.** Recusa cores por nome (`white`, `transparent`), `0` sem unidade e `rgb( 1, 2, 3 )` com espaço interno. Afrouxar com cuidado no subprojeto 5, antes de abrir temas à comunidade.
6. **A observação cobre só os filhos diretos do `body`.** Se o client vier a substituir o próprio `body`, ou mover o elemento raiz dele para dentro de outro, a ressincronização não acontece.
7. **O fundo do Vidro é uma imagem escura e discreta do client** (`/fe/lol-static-assets/2019-intro-background.jpg`), escolhida por existir, não por ser a melhor. Trocar por um vídeo ou imagem mais expressiva quando o tema for refinado.

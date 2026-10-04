# ReimaginedLC: design geral

Data: 2026-10-03
Status: aguardando revisão

## Objetivo

Substituir toda a interface do client do League of Legends por uma interface nova, escrita do zero, personalizável por temas (cores, fontes, formas, animações, mídia de fundo em imagem, vídeo ou gif) e por variantes de layout. Projeto público desde a primeira versão.

Sucesso significa: uma pessoa instala o plugin, joga uma partida inteira (lobby, fila, seleção de campeões, pós-jogo) sem ver a interface da Riot, troca de tema nas configurações e vê a mudança na hora.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Base técnica | Plugin do Pengu Loader, dentro do client oficial |
| Estratégia | Takeover total: a interface da Riot fica escondida e serve apenas de fallback |
| Stack | Vite, Preact, `@preact/signals`, TypeScript |
| Temas por jogo | Um tema para LoL e outro para TFT, troca automática |
| Personalização | Tokens de tema, mídia por tela e variantes de layout por tela. Sem editor livre de blocos |
| Dados | LCU, Data Dragon e CommunityDragon. Estatísticas de meta ficam para um módulo posterior |
| Público | Público desde o início: releases, i18n, documentação, temas da comunidade |
| Repositório | `C:\Users\Admin\dev\ReimaginedLC`, build grava em `Pengu Loader\plugins\ReimaginedLC\` |

### Escolhas visuais

| Peça | Padrão | Variante |
|---|---|---|
| Shell | Trilho lateral de ícones, lista de amigos em gaveta à direita | nenhuma |
| Tema LoL | Vidro: painéis translúcidos com blur sobre a mídia de fundo, cantos arredondados | Editorial: fundo sólido quase preto, tipografia grande, uma cor de destaque |
| Tema TFT | Vidro lúdico: herda de Vidro, formas mais redondas, botões com volume, dourado quente | nenhuma |
| Seleção de campeões | Cinemático: campeão em destaque em tela cheia, times em faixas no topo, grade em gaveta inferior | Clássico: aliados à esquerda, inimigos à direita, grade no centro |
| Lobby | Palco: cada jogador é uma coluna em tela cheia com splash, controles em barra flutuante | nenhuma |
| Tela inicial | Mídia de fundo em tela cheia, botão Jogar e atalho para as notas do patch | nenhuma |
| Transição entre telas | Cortina diagonal | Intensidade: completa, reduzida, desligada |

Os mockups apresentados no brainstorming estão em `docs/mockups/` (fragmentos HTML, um arquivo por peça, com todas as opções mostradas).

## Limites conhecidos

- O login acontece no Riot Client, fora do alcance do plugin.
- A loja usa páginas web da Riot. Não será refeita: a página original é exibida num painel.
- A interface da Riot continua carregada, escondida, porque é o fallback. O consumo de memória soma o dela e o nosso.
- Modificar o client é zona cinza nos termos da Riot. O Pengu Loader é tolerado hoje, sem garantia. O README declara isso.
- O repositório não redistribui assets da Riot. Ícones, splashes e sons são referenciados em tempo de execução pelas rotas do próprio client (`/lol-game-data/assets/...`, `/fe/...`) ou pelas CDNs públicas.

## Fora de escopo

- Revelar nomes ocultos na seleção de campeões, dodge sem penalidade, desbloqueio de skins e qualquer função que dê vantagem ou viole os termos. Colocariam em risco a conta de quem instala um projeto público.
- Refazer loja e login.
- Editor livre de layout (mover e redimensionar blocos).
- Atualização automática silenciosa do plugin.

## Arquitetura

Cada camada conhece apenas as camadas abaixo dela.

1. `lcu/`: cliente HTTP e um único WebSocket. Expõe um store por domínio (`gameflow`, `lobby`, `matchmaking`, `champSelect`, `chat`, `summoner`, e assim por diante), cada um com signals de estado e funções de ação. Os tipos são gerados a partir da descrição da API obtida no dump. Nenhuma tela chama `fetch` diretamente.
2. `data/`: acesso a Data Dragon e CommunityDragon com cache. Define a interface de provedor para as estatísticas de meta, sem implementação nesta fase.
3. `theme/`: carrega e valida manifestos, aplica tokens como variáveis CSS, resolve o tema ativo por jogo e a mídia de fundo por tela.
4. `ui/`: componentes base (botão, cartão, modal, lista, gaveta, toast, fundo de mídia). Leem apenas variáveis CSS, nunca valores fixos.
5. `screens/`: uma pasta por tela. Cada tela registra seus layouts por nome. Todos os layouts de uma tela consomem os mesmos stores.
6. `shell/`: root que cobre a janela, roteador dirigido pela fase do gameflow, trilho de navegação, gaveta de amigos, atalho de emergência, error boundaries.

### Motor de temas

Um tema é uma pasta com `theme.json` e arquivos de mídia. O manifesto declara:

- `name`, `version`, `extends` (opcional, nome do tema pai);
- `tokens`: cores, fontes, raios, blur, sombras, durações e curvas de animação;
- `transition`: nome de uma transição conhecida (`wipe`, `fade`, `slide`, `zoom`);
- `backgrounds`: mídia por tela, com um valor global de fallback;
- `layouts`: layout escolhido por tela, por exemplo `"champSelect": "cinematic"`.

Regras:

- O manifesto é somente dado. Temas não carregam JavaScript nem CSS livre. CSS arbitrário permitiria exfiltrar dados por `url()`.
- O manifesto é validado ao carregar. Em caso de erro, o tema Vidro é aplicado e a mensagem indica o campo inválido.
- Vidro lúdico e Editorial usam `extends: "vidro"` e sobrescrevem tokens. Os três temas compartilham os mesmos componentes.
- A configuração guarda `{ lol: "vidro", tft: "vidro-ludico" }`. O shell escolhe pelo tipo de fila do lobby atual; sem lobby, vale o último jogo usado.
- Vídeo de fundo pausa quando a janela perde o foco e durante a partida.
- `prefers-reduced-motion` força a intensidade reduzida.
- As transições usam a View Transitions API se o Chromium embutido suportar; caso contrário, classes CSS. O dump confirma a versão.

### Fluxo de dados

1. O plugin carrega e `lcu/` abre o WebSocket e assina os eventos da API.
2. Cada store faz um `GET` inicial e depois se atualiza pelos eventos. Não há polling.
3. O shell lê a fase do gameflow e escolhe a tela: `None` vai para a tela inicial, `Lobby` para o lobby, `Matchmaking` e `ReadyCheck` para a fila, `ChampSelect` para a seleção, `InProgress` para uma tela mínima, `EndOfGame` para o pós-jogo.
4. As telas leem signals e chamam ações. Uma ação é uma chamada HTTP à LCU. Não há atualização otimista: a interface muda apenas quando o evento do socket confirma.
5. Configuração e tema ativo ficam no `DataStore` do Pengu. Temas instalados pelo usuário ficam em pasta no disco.

### Tratamento de erros

| Situação | Comportamento |
|---|---|
| Socket cai | Reconexão com backoff, novo `GET` em todos os stores ativos, faixa "reconectando" visível |
| Ação retorna erro | Toast com a mensagem da LCU, estado inalterado |
| Exceção ao renderizar uma tela | Error boundary por tela. Em `ReadyCheck` e `ChampSelect`, a camada se desliga e o client original aparece |
| Fase ou fila desconhecida | Client original para aquela tela, registro no log |
| Endpoint ausente após patch | Store marcado como indisponível, tela cai no client original |
| Tema inválido | Tema Vidro aplicado, mensagem com o campo inválido |
| Mídia falha ao carregar | Cor de fundo do tema |

O atalho de emergência `Ctrl+Shift+F12` liga e desliga a camada a qualquer momento. Ele é registrado antes de qualquer outro código do plugin, para funcionar mesmo que o restante falhe ao iniciar.

Até o fim do subprojeto 2, a camada inicia desligada e é ligada pelo atalho.

### Segurança

- Texto de origem externa (nomes de invocador, mensagens de chat, status) é sempre inserido como texto, nunca como HTML.
- Manifestos de tema são validados contra um esquema e não executam código.
- A verificação de nova versão apenas avisa. O usuário baixa e instala manualmente.

## Testes

- **LCU simulada:** servidor local que reproduz HTTP e WebSocket a partir de gravações reais de sessão. Permite desenvolver e testar no navegador sem o client aberto.
- **Unitários (Vitest):** stores, roteador por fase, validador de manifesto, resolução de tema por jogo.
- **Telas:** um teste por tela contra a LCU simulada cobrindo o caminho principal.
- **Fallback:** teste que força uma exceção na seleção de campeões e verifica que a camada se desliga.
- **Client real:** checklist manual por release, em partida personalizada e na Ferramenta de Treino.

## Distribuição

- Repositório público no GitHub, licença MIT, aviso de projeto não oficial.
- Release em zip com a pasta do plugin, gerada por GitHub Actions a cada tag.
- i18n com chaves em JSON, `pt-BR` e `en-US` de início, idioma conforme o locale do client. Nomes de campeões, itens e filas vêm da LCU já localizados.
- Temas da comunidade importados pela tela de configurações, como pasta ou zip.
- Documentação: README com instalação e atalho de emergência, guia de criação de temas, guia de contribuição.

## Subprojetos

Cada subprojeto tem especificação e plano próprios. Esta especificação cobre o desenho geral e detalha apenas o subprojeto 0.

| # | Subprojeto | Marco |
|---|---|---|
| 0 | Dump e inventário | Relatório do que reaproveitar e do que cortar |
| 1 | Fundação: repositório, build, `lcu/`, `shell/`, `theme/`, atalho de emergência, LCU simulada | Tela inicial nova funcionando com tema Vidro e troca de tema |
| 2 | Fluxo de jogo: lobby, fila, ready check, seleção de campeões, pós-jogo | Partida completa sem a interface da Riot |
| 3 | Perfil, histórico, coleção, runas, loot | |
| 4 | Social: amigos, chat, convites | |
| 5 | Configurações, editor de tema, importação e exportação | |
| 6 | Tema e telas do TFT | |
| 7 | Distribuição: releases, verificação de versão, i18n completo, documentação | Primeira versão pública |
| 8 | Estatísticas de meta por provedor opcional | |

## Subprojeto 0: dump e inventário

Objetivo: saber, com dados, o que o client oferece, antes de escrever qualquer tela.

Entregas, todas em `docs/dump/` do repositório, exceto onde indicado:

1. **Descrição da API LCU.** Tentar `/swagger/v2/swagger.json` e `/swagger/v3/openapi.json`; se desativados, montar a partir de `/help`. Salvar o JSON bruto e gerar os tipos TypeScript.
2. **Mapa de telas.** Lista de todas as telas e modais do client atual, com a fase do gameflow e os endpoints que cada uma usa. Para cada uma: refazer, embutir a original ou cortar.
3. **Inventário de assets.** Lista dos plugins `rcp-fe-*` e das rotas de assets (`/fe/...`, `/lol-game-data/assets/...`), agrupada por tipo: ícones, fontes, sons, vídeos, imagens de fundo. Para cada grupo: reutilizar por referência, substituir ou ignorar. Os arquivos em si não entram no repositório.
4. **Ambiente de execução.** Versão do Chromium embutido, versão do Pengu Loader e a API que ele expõe a plugins (`init`, `load`, `DataStore`, acesso a arquivos, registro de atalhos), suporte a View Transitions API, `backdrop-filter`, codecs de vídeo (H.264, VP9, AV1) e WebM com transparência.
5. **Medição de base.** Memória e CPU do client ocioso na tela inicial, sem plugins, para comparar depois.
6. **Gravações de sessão.** Captura de HTTP e WebSocket de um ciclo completo em partida personalizada (lobby, seleção, pós-jogo), em formato que a LCU simulada do subprojeto 1 consiga reproduzir. Dados pessoais (nomes, PUUIDs, mensagens) são anonimizados antes de entrar no repositório.
7. **Relatório final.** `docs/dump/REPORT.md` com o resumo: o que reaproveitar, o que cortar, riscos encontrados e ajustes necessários neste desenho.

Ferramenta: um plugin Pengu descartável de coleta e scripts Node. O plugin de coleta não faz parte do produto.

Critério de conclusão: o relatório responde, para cada tela do client, se ela será refeita, embutida ou cortada, e confirma ou corrige as suposições de ambiente feitas neste documento (View Transitions, `backdrop-filter`, vídeo de fundo, API de atalhos do Pengu).

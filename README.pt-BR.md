<div align="center">

# ReimaginedLC

**Uma interface nova para o client do League of Legends, feita como plugin do [Pengu Loader](https://pengu.lol).**

[English](README.md) · Português · [简体中文](README.zh-CN.md)

![Início](docs/screenshots/home.png)

</div>

> [!WARNING]
> **Projeto não oficial.** O ReimaginedLC não é endossado pela Riot Games nem tem ligação com ela. Modificar o client é zona cinza nos termos da Riot. O Pengu Loader é tolerado hoje, sem garantia. Use por sua conta e risco.

## Sumário

- [O que ele faz](#o-que-ele-faz)
- [Imagens](#imagens)
- [Instalação](#instalação)
- [Primeiros passos](#primeiros-passos)
- [Plugins embutidos](#plugins-embutidos)
- [Atualizações](#atualizações)
- [Desligar e desinstalar](#desligar-e-desinstalar)
- [Problemas comuns](#problemas-comuns)
- [Temas e idioma](#temas-e-idioma)
- [Desenvolvimento](#desenvolvimento)
- [Licença](#licença)

## O que ele faz

O ReimaginedLC desenha as próprias telas por cima do client original. O client original continua rodando por baixo. Ele é a rede de segurança: se uma tela falhar, o ReimaginedLC se desliga e o client original volta.

- **Início, lobby e fila.** Seletor de rotas no estilo do client. Na fila, uma pílula no canto mostra a fila e o tempo; ela estica de volta para a barra do lobby quando você volta.
- **Seleção de campeões.** Splash grande no palco e os nomes reais dos aliados. Cada cartão de aliado mostra elo, PDL, taxa de vitória e KDA. Também: carrossel de skins, skins de sentinela, favoritos por rota (botão direito) e runas por confronto.
- **Pós-jogo.** Resultado, seus números com a posição na partida, gráficos, progresso de PDL e maestria, e quem te honrou. O TFT tem classificação, tabuleiro e comp de cada jogador e comparação com o seu histórico.
- **Honra.** Honre aliados e inimigos, como no client atual.
- **Perfil.** Seu fundo, brasão e banner. "Histórico de partidas" abre uma folha de vidro com o feed, de LoL ou TFT.
- **Coleção e espólios.** Filtros e abas, criação e rerrolagem de espólios, Loja Mítica e o Santuário. Compras sempre pedem confirmação.
- **Loja e eventos.** Skins em destaque com nome e transição entre splashes. O passe do evento mostra desabilitadas as recompensas bloqueadas.
- **Amigos e chat.** Gaveta que pode ficar fixa aberta, pastas que lembram o estado, cartão ao passar o mouse, chat da sala aberto por padrão e sons.
- **Configurações.** Editor de tema, fundo (imagem ou vídeo), modo leve para PCs fracos e idioma.

## Imagens

| | |
|---|---|
| ![Lobby](docs/screenshots/lobby.png) | ![Coleção](docs/screenshots/collection.png) |
| Lobby | Coleção |
| ![Perfil](docs/screenshots/profile.png) | ![Configurações](docs/screenshots/settings.png) |
| Perfil | Configurações e plugins |
| ![Loja](docs/screenshots/store.png) | ![Eventos](docs/screenshots/events.png) |
| Loja | Eventos |

## Instalação

### Requisitos

- Windows 10 ou 11 com o client do League of Legends instalado.
- [Pengu Loader](https://pengu.lol) **1.1.6** ou mais novo.

### Passo a passo

1. **Instale o Pengu Loader.**
   1. Baixe em [pengu.lol](https://pengu.lol) (ou nas [releases do GitHub](https://github.com/PenguLoader/PenguLoader/releases)).
   2. Abra e clique em **Activate**. Deixe o client fechado enquanto faz isso.
2. **Baixe o ReimaginedLC.**
   - Pegue `ReimaginedLC-<versão>.zip` em [Releases](https://github.com/kyso1/ReimaginedLC/releases/latest).
3. **Abra a pasta de plugins.**
   - No Pengu Loader, clique em **Plugins folder**. Normalmente é `C:\Program Files\Pengu Loader\plugins`.
4. **Extraia o zip lá dentro.**
   - O resultado precisa ser `plugins\ReimaginedLC\index.js`.
   - Se ficar `plugins\ReimaginedLC\ReimaginedLC\index.js`, suba a pasta de dentro um nível.
5. **Abra o client do League.**
   - Se ele já estava aberto, recarregue com **Ctrl+Shift+R**.
6. **Ligue a interface nova.**
   - Aperte **Ctrl+Shift+F12**. Ela continua ligada da próxima vez que você abrir o client.

```text
Pengu Loader/
└── plugins/
    └── ReimaginedLC/
        ├── index.js      ← carregador (procura atualizações)
        └── app/          ← cópia local da interface
```

## Primeiros passos

- O **trilho da esquerda** é o menu principal: início, jogar, perfil, coleção, espólios, loja, eventos e configurações.
- **Client original**, no fim do trilho, volta para a interface da Riot. **Ctrl+Shift+F12** faz o mesmo a qualquer momento.
- Em **Configurações › Geral** você escolhe o idioma, o modo leve e se a interface abre junto com o client.
- Em **Configurações › Aparência** você escolhe o tema e o fundo.

## Plugins embutidos

Todos começam desligados. Ligue em **Configurações › Plugins**.

| Plugin | O que faz |
|---|---|
| **Aceitar automaticamente** | Aceita a partida quando a fila estoura. |
| **Aparecer offline** | Mantém seu status do chat offline, inclusive durante as partidas. |
| **Marketplace** | Instala plugins do Pengu Loader (só plugins, sem temas) do registro da comunidade. |
| **ROSE** | Integra com o [ROSE](https://github.com/Alban1911/Rose), um app à parte para skins personalizadas, para escolher a skin no carrossel da seleção de campeões. O ROSE é uma ferramenta de terceiros, com riscos próprios. |
| **Spotify** | Mostra o que está tocando no seu Spotify e controla pelo client. Os controles exigem Spotify Premium. Também pode mostrar a música no seu status. Precisa de um Client ID gratuito de desenvolvedor do Spotify; as configurações do plugin explicam o passo a passo. |

## Atualizações

O `index.js` do zip é um carregador pequeno. A cada 6 horas ele procura uma versão nova no GitHub e baixa pelo jsDelivr. Ele só executa código com assinatura verificada (ECDSA P-256 e SHA-256). Se algo falhar, ele usa a cópia local em `app/`.

Quando uma atualização fica pronta, aparece um aviso com o botão **Recarregar** em **Configurações › Geral**. Ele nunca recarrega sozinho, e o botão fica desativado na fila, na seleção de campeões e durante a partida.

## Desligar e desinstalar

- **Desligar:** aperte **Ctrl+Shift+F12** ou clique em **Client original** no trilho.
- **Desinstalar:** apague a pasta `Pengu Loader/plugins/ReimaginedLC` e recarregue o client.
- **Remover o Pengu Loader:** abra o Pengu Loader e clique em **Deactivate**.

## Problemas comuns

| Problema | Solução |
|---|---|
| Nada muda depois de instalar | Confira se o arquivo está em `plugins/ReimaginedLC/index.js` e se o Pengu Loader está ativado. Depois aperte **Ctrl+Shift+F12**. |
| Aviso "uma tela falhou" e o client original volta | Recarregue com **Ctrl+Shift+R**. Se repetir, copie o relatório em **Configurações › Geral › Relatório de erro** e cole numa [issue](https://github.com/kyso1/ReimaginedLC/issues) ou numa IA. |
| Client lento | Ligue o **Modo leve** em **Configurações › Geral** (sem desfoque de vidro e com vídeos de fundo pausados). |
| Preso em "Aguardando" depois da partida | Atualize para a última versão; as etapas do pós-jogo são concluídas sozinhas. |

## Temas e idioma

- **Temas.** Vidro, Vidro lúdico (padrão no TFT) e Editorial vêm com o plugin. Crie o seu em **Configurações › Aparência › Novo tema** ou importe um JSON. O editor de tema monta um prompt para o ChatGPT, o Claude ou qualquer IA e carrega a resposta de volta; para mudanças maiores existe o **CSS personalizado**. Veja o [guia de temas](docs/THEMES.md).
- **Idioma.** A interface está em português (Brasil) e inglês, seguindo o idioma do client. Nomes de campeões, itens e filas vêm do client, já traduzidos.

## Desenvolvimento

```bash
npm ci
npm test                              # testes das ferramentas, do app e do carregador
npx vite build --mode client          # compila e copia para a pasta de plugins do Pengu
```

- `docs/publicacao.md` explica o fluxo de lançamento e a assinatura das atualizações.
- Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para as convenções de código. Agentes de IA leem o [AGENTS.md](AGENTS.md).

## Licença

[MIT](LICENSE).

O repositório não contém arquivos da Riot. Ícones, splashes e sons são carregados do próprio client em tempo de execução. League of Legends é marca registrada da Riot Games, Inc.

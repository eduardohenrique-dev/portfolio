/**
 * Projetos no ar. Números e decisões vêm do código, dos READMEs e da documentação de cada repositório.
 * Os sistemas internos (Scrims, HQ, DGAMES) abrem numa demo com dados fictícios.
 * Os apps de Windows (Acervo, Palco, Penumbra) não têm site: o link abre o código no GitHub.
 */
export interface Projeto {
  id: "scrims" | "hq" | "gvtem" | "deck" | "dgames" | "acervo" | "palco" | "penumbra";
  nome: string;
  objeto: "cartucho" | "fichario" | "guia" | "caixa-deck" | "caixa-loja" | "cofrinho" | "gato-tv" | "coruja";
  /** o que o objeto é, para leitores de tela */
  objetoDescricao: string;
  url: string;
  /** "demo" quando o link abre uma cópia com dados fictícios; "codigo" quando abre o repositório (apps de desktop) */
  link: "site" | "demo" | "codigo";
  /** como entrar, quando não é só abrir o link */
  acesso?: string;
  quando: string;
  resumo: string;
  problema: string;
  decisao: string;
  resultado: string;
  feitoCom: string;
}

export const PROJETOS: Projeto[] = [
  {
    id: "scrims",
    nome: "EINERD Scrims",
    objeto: "cartucho",
    objetoDescricao: "um cartucho de jogo com VS no rótulo",
    url: "https://einerd-scrims-demo.vercel.app",
    link: "demo",
    acesso: "Demo com dados fictícios. Você já entra logado, e o que mudar fica só no seu navegador.",
    quando: "desde julho de 2026",
    resumo: "Registro de treinos e leitura de dados de partida para o time de LoL da Ei Nerd.",
    problema:
      "Cada bloco de scrim gera draft, resultado e dezenas de números por jogador. A Ei Nerd precisava de um lugar único para registrar os treinos — draft completo, resultado, calendário — e de indicadores que saíssem dos dados reais das partidas.",
    decisao:
      "Os dados vêm da API da GRID, que aceita 40 requisições por minuto. O arquivo completo de eventos tem 88 MB por jogo, grande demais para uma função serverless, então a ingestão diária usa a timeline da partida (cerca de 700 KB) e grava tudo normalizado no Supabase. Como a GRID recicla o ID de time entre organizações, o time é identificado pelo elenco.",
    resultado:
      "Indicadores por jogador e por time (dano por minuto, visão, diferença de ouro e de CS aos 15), radar de rota do caçador e de wards, histórico de partidas profissionais e tier list do meta. A ingestão roda sozinha de madrugada, todo dia, e as regras de cálculo têm 71 testes.",
    feitoCom: "React 18 e Vite 6 em JavaScript, Tailwind, Supabase com realtime, funções e cron na Vercel, Vitest.",
  },
  {
    id: "hq",
    nome: "EINERD HQ",
    objeto: "fichario",
    objetoDescricao: "um fichário rosa com HQ na etiqueta",
    url: "https://einerd-hq-demo.vercel.app",
    link: "demo",
    acesso: "Demo com dados fictícios. Você entra como visitante, e o que mudar vale só para você.",
    quando: "setembro de 2026",
    resumo: "Central de gestão do time de esports da Ei Nerd.",
    problema:
      "A gestão de um time de esports mistura agenda, tarefas, gaming house, contratos, conteúdo e prestação de contas. E nem todo mundo da equipe pode ver salário, valor gasto ou contato pessoal.",
    decisao:
      "A permissão mora no Postgres, não na interface. São quatro papéis com Row Level Security: quem não tem acesso não recebe o dado nem chamando a API direto com o próprio token. O e-mail dos membros sai por uma view que devolve nulo para quem não pode vê-lo, e as notas fiscais ficam num bucket privado, abertas só por URL assinada.",
    resultado:
      "Dez módulos num app só: central do dia, calendário, kanban, gaming house, prestação de contas, contatos, lineup, conteúdo, conversas em tempo real e gestão de acessos. Qualquer conta Google entra como pendente e só vê alguma coisa depois que um admin libera.",
    feitoCom: "Next.js 16 com App Router, React 19 e TypeScript, Tailwind v4 com os tokens da marca, Supabase (login Google, RLS, realtime e storage), dnd-kit.",
  },
  {
    id: "gvtem",
    nome: "GVTEM",
    objeto: "guia",
    objetoDescricao: "um guia de mapa dobrado, com GV na capa e um alfinete",
    url: "https://gvtem.vercel.app",
    link: "site",
    quando: "no ar desde 2009, refeito em 2026",
    resumo: "Guia de negócios de Governador Valadares, com avaliações, busca e painel para o dono do negócio.",
    problema:
      "O GVTEM existe desde 2009 como site em PHP, com 122 negócios de Valadares. Em 2026 eu refiz a plataforma, e a versão nova precisava de avaliação, de uma busca que achasse o que a pessoa digitou sem acento ou com erro e de um painel para o dono cuidar da própria página. No meio do caminho, o plano gratuito do Supabase apagou o banco, que estava pausado havia meses.",
    decisao:
      "A busca roda no próprio Postgres, com pg_trgm e unaccent num índice trigram, sem serviço externo. As 203 categorias herdadas, 168 delas com um negócio só, viraram filhas de 15 grupos. Depois da perda do banco, o schema do Prisma subiu no Neon sem nenhuma alteração, o login passou para Auth.js e as fotos para o Vercel Blob.",
    resultado:
      "De volta ao ar com os 122 negócios do acervo. Cada negócio tem página com mapa, horário e aviso de aberto agora, avaliações com resposta do dono e aprovação pelo admin, e a home mostra o clima de Valadares ao vivo. Toda foto é reduzida e regravada em WebP no navegador, sem os dados de GPS, antes de subir.",
    feitoCom: "Next.js 16 e React 19 em TypeScript, Tailwind v4, Prisma 6 com Postgres no Neon, Auth.js, Vercel Blob, GSAP, monorepo com pnpm.",
  },
  {
    id: "deck",
    nome: "Deck Scanner",
    objeto: "caixa-deck",
    objetoDescricao: "uma caixa de deck com uma carta saindo, dentro dos cantos do visor de uma câmera",
    url: "https://deck-scanner.vercel.app",
    link: "site",
    acesso: "Para escanear, é preciso criar uma conta.",
    quando: "setembro de 2026",
    resumo: "Aponte a câmera para cartas de Magic e receba a decklist pronta, com a coleção física catalogada.",
    problema:
      "Montar a lista de um deck de Magic à mão é carta por carta. E quem tem coleção física perde a conta de onde está cada cópia: na caixa, na pasta ou dentro de outro deck.",
    decisao:
      "A visão roda no navegador, com OpenCV.js num Web Worker: acha o contorno da carta, espera ela parar e manda para o servidor só os melhores recortes. Lá, um hash perceptual de 256 bits compara o recorte com 111.700 impressões em milissegundos, e a IA fica opcional, só para o que sobra. Os formatos são regras em JSON, e tudo cabe nos planos gratuitos da Vercel, do Neon e do Cloudflare R2.",
    resultado:
      "Num vídeo de teste com 100 cartas, a lista saiu certa nas 100, tanto na visão em Python quanto na do navegador, e o hash resolveu de 96% a 100% das cartas sem IA nos testes. Os testes ainda usam cenas montadas; falta calibrar com luz e desgaste reais. Em volta do scanner: aviso quando a mesma carta está em dois decks, conferência, histórico, preço em reais, bracket de Commander e uma aba de torneio com suíço e telão.",
    feitoCom: "React 19, TypeScript e Vite, Tailwind v4, Python 3.13 com FastAPI, OpenCV, Postgres e login no Neon, Cloudflare R2, Vercel.",
  },
  {
    id: "dgames",
    nome: "DGAMES",
    objeto: "caixa-loja",
    objetoDescricao: "uma caixa de papelão com um D rosa na frente e uma etiqueta de preço",
    url: "https://eduardohenrique-nu.vercel.app/demos/dgames",
    link: "demo",
    acesso: "Demo com dados fictícios, guardados só no seu navegador.",
    quando: "junho de 2026",
    resumo: "Estoque e lucro de uma loja de revenda de games, num arquivo que abre com dois cliques.",
    problema:
      "A loja compra e revende consoles, controles, jogos e acessórios. Precisava saber o que está em estoque, de quem cada peça foi comprada, para quem foi vendida e quanto deu de lucro, sem instalar nada.",
    decisao:
      "O app inteiro é um index.html que abre por duplo-clique. Como o navegador bloqueia módulos separados num arquivo local, o código vive em 18 módulos comentados e um build junta tudo num arquivo só. Os dados ficam no próprio navegador, em IndexedDB com cópia no localStorage, e as fotos são reduzidas antes de guardar.",
    resultado:
      "Cadastro com até 5 fotos, fornecedor e cliente com CEP e telefone formatados enquanto se digita, lucro por item e acumulado, e backup num JSON único que substitui ou mescla os dados em outro computador.",
    feitoCom: "React 18 e Tailwind pelo CDN, Babel no navegador, IndexedDB, build em Node que junta os módulos.",
  },
  {
    id: "acervo",
    nome: "Acervo",
    objeto: "cofrinho",
    objetoDescricao: "um cofrinho de porquinho rosa com uma moeda entrando pela fenda",
    url: "https://github.com/eduardohenrique-dev/acervo",
    link: "codigo",
    acesso: "App de Windows: o link abre o código, com as instruções para gerar o instalador.",
    quando: "novembro de 2026",
    resumo: "O armazenamento do PC mostrado como no iPhone, com o que o Windows não mostra.",
    problema:
      "A tela de armazenamento do Windows joga quase tudo em \"Outros\": jogos de launchers, caches, restos de programas desinstalados e pastas de desenvolvimento somem no meio. E percorrer pasta por pasta um disco de 1 TB leva minutos.",
    decisao:
      "O app lê a Master File Table do NTFS direto e monta a árvore do disco em segundos. Depois acompanha o USN Journal, o diário de mudanças do próprio disco, e guarda um snapshot ao fechar para reabrir só com o que mudou. As ações passam pela mesma API do Explorer, e uma política separada da interface decide o que pode ser mexido.",
    resultado:
      "Cada disco em 10 categorias, com regras por caminho, nome de pasta e extensão. A barra muda em menos de um segundo quando algo é criado ou apagado. Dá para entrar em cada categoria, listar todos os arquivos do maior ao menor e mandar para a Lixeira, mover ou copiar, sem nunca tocar no que é do Windows. São cerca de 130 testes em Rust e 26 na interface.",
    feitoCom: "Rust num workspace com quatro crates, Tauri 2, React 19 e TypeScript, Tailwind 4, Win32 (MFT, USN Journal, IFileOperation), Vitest.",
  },
  {
    id: "palco",
    nome: "Palco",
    objeto: "gato-tv",
    objetoDescricao: "um gato preto sentado em cima de uma TV que mostra um palco com holofote",
    url: "https://github.com/eduardohenrique-dev/palco",
    link: "codigo",
    acesso: "App de Windows: o link abre o código, com as instruções para gerar o instalador.",
    quando: "novembro de 2026",
    resumo: "Manda cada jogo para a tela escolhida, inclusive os que só abrem no monitor principal.",
    problema:
      "Muito jogo de PC só abre no monitor principal. Para jogar na TV, o caminho era trocar a tela principal nas configurações do Windows, jogar e trocar de volta, toda vez.",
    decisao:
      "Nada de cadastro prévio: quando um jogo abre, um aviso sem foco aparece no canto com um botão por tela, porque tirar o foco de um jogo em tela cheia exclusiva o minimiza. O Palco tenta do mais leve para o mais invasivo: mover a janela, trocar a principal deslocando todas as telas pela API de configuração de vídeo, e por último fechar e reabrir o jogo já na tela certa.",
    resultado:
      "O caminho que funcionou fica salvo no perfil de cada jogo, e da próxima vez o Palco vai direto nele, ou age sozinho com \"sempre nesta tela\". Quando o jogo fecha, a tela principal volta, mesmo que o app tenha sido fechado no meio. Nada é injetado no jogo, o que é seguro com anti-cheat.",
    feitoCom: "Rust e Tauri 2, Win32 (SetDisplayConfig, janelas e processos), interface em HTML, CSS e JavaScript puro.",
  },
  {
    id: "penumbra",
    nome: "Penumbra",
    objeto: "coruja",
    objetoDescricao: "uma coruja num poleiro, com o olho direito meio coberto pela sombra",
    url: "https://github.com/eduardohenrique-dev/penumbra",
    link: "codigo",
    acesso: "App de Windows: o link abre o código, com as instruções para gerar o instalador.",
    quando: "novembro de 2026",
    resumo: "Escurece cada monitor separadamente, com o brilho do próprio monitor e uma camada por cima.",
    problema:
      "No Windows, o brilho por tela só existe em notebook, e a luz noturna vale para todas as telas juntas. Com dois monitores, um deles na vertical, não dava para escurecer só um à noite.",
    decisao:
      "Até a metade, quem escurece é o próprio monitor, pelo protocolo DDC/CI, sem perder contraste. Daí em diante, uma camada preta transparente aos cliques completa o resto. As camadas são janelas nativas do Windows, sem navegador, e a interface só existe enquanto está aberta.",
    resultado:
      "Um controle de 0 a 90% por tela, atalhos globais e presets na bandeja. Com a janela fechada, o app inteiro fica em cerca de 16 MB de memória e 0% de CPU, e ao sair o brilho original de cada monitor volta.",
    feitoCom: "Rust e Tauri 2, Win32 (janelas em camadas, DDC/CI pelo dxva2), interface em HTML, CSS e JavaScript puro.",
  },
];

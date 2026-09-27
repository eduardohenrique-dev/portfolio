/**
 * Projetos no ar. Números e decisões vêm do código, dos READMEs e da documentação de cada repositório.
 * Os sistemas internos (Scrims, HQ, DGAMES) abrem numa demo com dados fictícios.
 */
export interface Projeto {
  id: "scrims" | "hq" | "gvtem" | "deck" | "dgames";
  nome: string;
  objeto: "cartucho" | "fichario" | "guia" | "caixa-deck" | "caixa-loja";
  /** o que o objeto é, para leitores de tela */
  objetoDescricao: string;
  url: string;
  /** "demo" quando o link abre uma cópia com dados fictícios, não o sistema de verdade */
  link: "site" | "demo";
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
];

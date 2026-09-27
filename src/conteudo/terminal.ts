/**
 * Terminal: sugestões e respostas prontas do modo offline.
 * As respostas offline são escritas à mão a partir dos mesmos fatos da página.
 */
import { PERFIL } from "./perfil";

export const LIMITE_POR_HORA = 6;
export const TAMANHO_MAXIMO_PERGUNTA = 280;

export const TERMINAL = {
  titulo: "Pergunte sobre o meu trabalho",
  texto: `As respostas vêm da API do Claude, com base só no que está escrito nesta página. São até ${LIMITE_POR_HORA} perguntas por hora para cada visitante. Se a cota acabar ou a API falhar, o terminal avisa e responde em modo offline, com respostas prontas.`,
  boasVindas: "Pergunte algo sobre os projetos, a stack ou como falar comigo.",
  sugestoes: [
    "O que você fez para a Ei Nerd?",
    "Como o HQ decide quem vê o quê?",
    "Como o Deck Scanner reconhece uma carta?",
    "Qual stack você usa mais?",
  ],
};

interface RespostaOffline {
  chaves: string[];
  texto: string;
}

export const RESPOSTAS_OFFLINE: RespostaOffline[] = [
  {
    chaves: ["ei nerd", "einerd", "esports", "time", "scrim", "scrims", "treino"],
    texto:
      "Para a Ei Nerd, o Eduardo fez dois sistemas. O EINERD Scrims registra os blocos de treino com draft e resultado e transforma os dados de partida da API da GRID em indicadores por jogador e por time. O EINERD HQ junta a gestão do time num app só: agenda, kanban, gaming house, prestação de contas, contatos, lineup, conteúdo e conversas.",
  },
  {
    chaves: ["hq", "permissao", "permissoes", "rls", "papel", "papeis", "acesso", "seguranca"],
    texto:
      "No EINERD HQ a permissão mora no Postgres: são quatro papéis com Row Level Security, então quem não tem acesso não recebe o dado nem chamando a API direto. O e-mail dos membros sai por uma view que devolve nulo para quem não pode ver, e as notas fiscais ficam num bucket privado, abertas só por URL assinada.",
  },
  {
    chaves: ["stack", "tecnologia", "tecnologias", "linguagem", "usa", "ferramenta", "next", "react", "supabase", "typescript"],
    texto:
      "O que mais aparece nos projetos dele: React, Tailwind e Node.js em todos; Next.js no HQ, no GVTEM e neste site, e TypeScript também no Deck Scanner; PostgreSQL em quatro deles, pelo Supabase no Scrims e no HQ e pelo Neon no GVTEM e no Deck Scanner. O Deck Scanner tem API em Python com FastAPI e visão com OpenCV.",
  },
  {
    chaves: ["servico", "servicos", "oferece", "faz", "ux", "ui", "design", "interface", "deploy", "integracao", "integracoes"],
    texto:
      "O Eduardo trabalha do rascunho ao ar, em cinco paradas: entender (UX, arquitetura e fluxos), desenhar (UI e design system em código), construir (sistemas e plataformas sob medida), conectar (dados e integrações com APIs) e publicar (deploy e infraestrutura). Dá para chamar para uma parada ou para o caminho inteiro. O mapa na seção de serviços mostra onde ele já fez cada uma.",
  },
  {
    chaves: ["gvtem", "valadares", "guia", "negocios", "avaliacao"],
    texto:
      "O GVTEM é um guia de negócios de Governador Valadares que existe desde 2009. Em 2026 o Eduardo refez a plataforma, com os 122 negócios do site antigo, avaliações, busca que tolera acento e erro de digitação e painel para o dono do negócio. Está em gvtem.vercel.app, feito com Next.js 16, Prisma, Postgres no Neon e Auth.js.",
  },
  {
    chaves: ["deck", "scanner", "magic", "mtg", "carta", "cartas", "camera", "visao", "opencv", "python"],
    texto:
      "O Deck Scanner lê cartas de Magic pela câmera e monta a decklist. A visão roda no navegador com OpenCV.js e só manda os melhores recortes; o servidor, em Python, compara cada recorte com 111.700 impressões por hash perceptual. Num vídeo de teste com 100 cartas, acertou as 100. Está em deck-scanner.vercel.app.",
  },
  {
    chaves: ["dgames", "loja", "estoque", "lucro", "games", "revenda"],
    texto:
      "O DGAMES controla estoque e lucro de uma loja de revenda de games: fotos, fornecedor, cliente, lucro por item e backup em JSON. É um index.html que abre com dois cliques, com os dados guardados no navegador. Há uma demo com dados fictícios na prateleira de projetos.",
  },
  {
    chaves: ["ia", "claude", "inteligencia", "llm", "terminal", "anthropic", "gpt"],
    texto:
      "Este terminal é a integração com IA do site: uma rota no servidor chama a API do Claude com as informações desta página, devolve a resposta em streaming e limita o uso por visitante. Quando a cota acaba ou a API não responde, entra este modo offline, com respostas prontas.",
  },
  {
    chaves: ["contato", "email", "e-mail", "contratar", "freela", "proposta", "vaga", "trabalho", "orcamento", "falar"],
    texto: `O melhor caminho é e-mail: ${PERFIL.email}. Conte o que você precisa, para quem é e até quando. Ele responde em ${PERFIL.prazoResposta}.`,
  },
  {
    chaves: ["faculdade", "curso", "estuda", "formacao", "ads", "periodo"],
    texto: "O Eduardo está no 4º período de Análise e Desenvolvimento de Sistemas.",
  },
  {
    chaves: ["onde", "mora", "cidade", "local", "remoto"],
    texto: "Ele é de Governador Valadares, em Minas Gerais.",
  },
];

export const RESPOSTA_OFFLINE_PADRAO = `Não tenho resposta pronta para isso no modo offline. Escreva para ${PERFIL.email} que ele responde em ${PERFIL.prazoResposta}.`;

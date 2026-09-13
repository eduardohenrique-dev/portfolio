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
    "Por que as funções do LoL Coach rodam em São Paulo?",
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
    chaves: ["coach", "sao paulo", "gru1", "regiao", "lento", "latencia", "velocidade", "desempenho"],
    texto:
      "No LoL Coach Pilot, as funções rodavam na região padrão da Vercel, nos Estados Unidos, e cada tela levava de 1,1 s a 1,7 s porque fazia várias consultas seguidas a um banco no Brasil. Com as funções fixadas em São Paulo, o mesmo teste caiu para 170–350 ms.",
  },
  {
    chaves: ["stack", "tecnologia", "tecnologias", "linguagem", "usa", "ferramenta", "next", "react", "supabase", "typescript"],
    texto:
      "O que mais aparece nos projetos dele: React, Tailwind, Node.js e Vercel em todos; Next.js e TypeScript no HQ, no LoL Coach, no GVTEM e neste site; Supabase com PostgreSQL nos quatro projetos em produção. O Scrims é React com Vite, em JavaScript, com testes em Vitest.",
  },
  {
    chaves: ["gvtem", "valadares", "guia", "negocios", "avaliacao"],
    texto:
      "O GVTEM é um projeto próprio do Eduardo, de junho de 2026: um guia de negócios de Governador Valadares, com avaliações, busca que tolera acento e erro de digitação e painel para o dono do negócio. Foi feito com Next.js 16, Supabase e Prisma.",
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

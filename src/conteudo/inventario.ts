/**
 * Inventário: onde cada tecnologia entrou. A contagem é sobre cinco projetos —
 * EINERD Scrims, EINERD HQ, LoL Coach Pilot, GVTEM e este site.
 */
export interface Item {
  id: string;
  nome: string;
  icone: string;
  projetos: string[];
  como: string;
  /** O item aponta para o terminal: sai do inventário quando o terminal não está no ar. */
  soComTerminal?: boolean;
}

export const TOTAL_PROJETOS = 5;

export const INVENTARIO: Item[] = [
  {
    id: "typescript",
    nome: "TypeScript",
    icone: "icone-typescript",
    projetos: ["EINERD HQ", "LoL Coach Pilot", "GVTEM", "este site"],
    como: "Tipos do banco espelhados à mão no HQ, para a UI nunca pedir coluna que não existe. O Scrims ficou em JavaScript.",
  },
  {
    id: "react",
    nome: "React",
    icone: "icone-react",
    projetos: ["EINERD Scrims", "EINERD HQ", "LoL Coach Pilot", "GVTEM", "este site"],
    como: "Server Components no HQ e no Coach; no Scrims, SPA com Context API, escrita otimista e realtime.",
  },
  {
    id: "nextjs",
    nome: "Next.js",
    icone: "icone-nextjs",
    projetos: ["EINERD HQ", "LoL Coach Pilot", "GVTEM", "este site"],
    como: "App Router em todos; Server Actions no Coach; proxy.ts no lugar do middleware no Next 16.",
  },
  {
    id: "vite",
    nome: "Vite",
    icone: "icone-vite",
    projetos: ["EINERD Scrims"],
    como: "Build do Scrims, com funções da Vercel ao lado para a ingestão de dados.",
  },
  {
    id: "tailwind",
    nome: "Tailwind CSS",
    icone: "icone-tailwind",
    projetos: ["EINERD Scrims", "EINERD HQ", "LoL Coach Pilot", "GVTEM", "este site"],
    como: "Tokens semânticos no @theme do HQ (ink, line, surface, royal); aqui, a paleta inteira troca de valor conforme o horário.",
  },
  {
    id: "supabase",
    nome: "Supabase",
    icone: "icone-supabase",
    projetos: ["EINERD Scrims", "EINERD HQ", "LoL Coach Pilot", "GVTEM"],
    como: "Login com Google no HQ e no GVTEM, realtime no Scrims e no HQ, storage privado com URL assinada no HQ.",
  },
  {
    id: "postgresql",
    nome: "PostgreSQL",
    icone: "icone-postgresql",
    projetos: ["EINERD Scrims", "EINERD HQ", "LoL Coach Pilot", "GVTEM"],
    como: "RLS por papel, trigger que protege coluna, view que esconde campo e busca sem acento com pg_trgm no GVTEM.",
  },
  {
    id: "nodejs",
    nome: "Node.js",
    icone: "icone-nodejs",
    projetos: ["EINERD Scrims", "EINERD HQ", "LoL Coach Pilot", "GVTEM", "este site"],
    como: "Runtime das funções serverless e dos scripts de ingestão da GRID; aqui, gera a pixel art e a fonte no build.",
  },
  {
    id: "vercel",
    nome: "Vercel",
    icone: "icone-vercel",
    projetos: ["EINERD Scrims", "EINERD HQ", "LoL Coach Pilot", "GVTEM", "este site"],
    como: "Deploy de todos; cron diário no Scrims; funções fixadas em São Paulo no Coach.",
  },
  {
    id: "prisma",
    nome: "Prisma",
    icone: "icone-prisma",
    projetos: ["GVTEM"],
    como: "ORM do GVTEM, num monorepo com pnpm.",
  },
  {
    id: "vitest",
    nome: "Vitest",
    icone: "icone-vitest",
    projetos: ["EINERD Scrims"],
    como: "71 testes nas regras de indicadores do Scrims — regra de cálculo nova entra com teste.",
  },
  {
    id: "grid",
    nome: "GRID API",
    icone: "icone-grid",
    projetos: ["EINERD Scrims"],
    como: "Dados oficiais de partidas de LoL: séries, eventos e timeline, respeitando o limite de 40 requisições por minuto.",
  },
  {
    id: "fullcalendar",
    nome: "FullCalendar",
    icone: "icone-fullcalendar",
    projetos: ["LoL Coach Pilot"],
    como: "Agenda de aulas com arrastar para remarcar, redesenhada por completo no CSS.",
  },
  {
    id: "dndkit",
    nome: "dnd-kit",
    icone: "icone-dndkit",
    projetos: ["EINERD HQ"],
    como: "Kanban de tarefas e pipeline de conteúdo com arrastar e soltar.",
  },
  {
    id: "claude",
    nome: "API do Claude",
    icone: "icone-claude",
    projetos: ["este site"],
    como: "O terminal lá embaixo: streaming, limite de uso por visitante e modo offline quando a API não responde.",
    soComTerminal: true,
  },
  {
    id: "gsap",
    nome: "GSAP",
    icone: "icone-gsap",
    projetos: ["este site"],
    como: "A luz que muda com a rolagem, o objeto que vira painel e a caminhada da trajetória.",
  },
];

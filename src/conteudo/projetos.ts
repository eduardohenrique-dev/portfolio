/**
 * Projetos em produção. Números e decisões vêm do código e dos READMEs de cada repositório.
 */
export interface Projeto {
  id: "scrims" | "hq" | "coach";
  nome: string;
  objeto: "cartucho" | "fichario" | "caderno";
  /** o que o objeto é, para leitores de tela */
  objetoDescricao: string;
  url: string;
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
    url: "https://einerd-scrims.vercel.app",
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
    url: "https://einerd-hq.vercel.app",
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
    id: "coach",
    nome: "LoL Coach Pilot",
    objeto: "caderno",
    objetoDescricao: "um caderno espiral verde com COACH na etiqueta",
    url: "https://lolcoachpilot.vercel.app",
    quando: "agosto de 2026",
    resumo: "Gestão de aulas particulares de League of Legends, com área do professor e do aluno.",
    problema:
      "Aula particular tem pacote contratado, remarcação, anotação e vídeo da sessão. O professor precisa ver tudo; cada aluno, só o que é dele.",
    decisao:
      "O isolamento é feito no banco. A RLS filtra as linhas e um trigger bloqueia as colunas: o aluno só consegue editar a própria anotação, mesmo chamando a API REST do Supabase fora do app. Os horários ficam gravados como instante em UTC e aparecem no fuso configurado.",
    resultado:
      "Com as funções na região padrão da Vercel, nos Estados Unidos, cada tela levava de 1,1 s a 1,7 s, porque fazia várias consultas seguidas a um banco no Brasil. Fixei as funções em São Paulo e o mesmo teste caiu para 170–350 ms.",
    feitoCom: "Next.js 15 com Server Actions e TypeScript, React 18 (o FullCalendar 6 ainda exige), Tailwind, Radix, Supabase Auth e Postgres.",
  },
];

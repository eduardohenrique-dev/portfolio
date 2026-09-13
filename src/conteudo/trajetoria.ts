/**
 * Marcos com data verificada nos repositórios (GitHub e git local).
 */
export interface Marco {
  id: string;
  quando: string;
  /** ISO para o <time> */
  data: string;
  titulo: string;
  texto: string;
}

export const TRAJETORIA: Marco[] = [
  {
    id: "cursos",
    quando: "out. 2025",
    data: "2025-10",
    titulo: "Primeiros repositórios",
    texto: "Os exercícios dos cursos de HTML, CSS e JavaScript vão para o GitHub.",
  },
  {
    id: "cursodev",
    quando: "jan. 2026",
    data: "2026-01",
    titulo: "curso.dev",
    texto: "Começo o clone do TabNews, o projeto do curso.dev.",
  },
  {
    id: "gvtem",
    quando: "jun. 2026",
    data: "2026-06",
    titulo: "GVTEM",
    texto: "Projeto próprio: guia de negócios de Governador Valadares, com avaliações, busca que tolera acento e erro de digitação, e painel para o dono do negócio.",
  },
  {
    id: "scrims",
    quando: "jul. 2026",
    data: "2026-07",
    titulo: "EINERD Scrims",
    texto: "Primeiro sistema para a Ei Nerd: registro de treinos e, logo depois, os dados de partida vindos da GRID.",
  },
  {
    id: "coach",
    quando: "ago. 2026",
    data: "2026-08",
    titulo: "LoL Coach Pilot",
    texto: "Gestão de aulas particulares de LoL, com o isolamento de cada aluno garantido no banco.",
  },
  {
    id: "hq",
    quando: "set. 2026",
    data: "2026-09",
    titulo: "EINERD HQ",
    texto: "A operação inteira do time de esports da Ei Nerd num app só.",
  },
  {
    id: "site",
    quando: "set. 2026",
    data: "2026-09",
    titulo: "Este site",
    texto: "Pixel art e fonte feitas em código, luz que muda com a rolagem e um terminal que responde com a API do Claude.",
  },
];

export const AGORA = "Análise e Desenvolvimento de Sistemas, 4º período, em andamento.";

/**
 * Fatos pessoais. Tudo aqui foi confirmado pelo Eduardo ou verificado no código dele.
 * A página e o terminal de IA leem daqui — mudou um fato, muda só aqui.
 */
export const PERFIL = {
  nome: "Eduardo Henrique",
  nomeCompleto: "Eduardo Henrique Correa de Carvalho",
  cidade: "Governador Valadares, MG",
  papel: "Full stack e UX/UI",
  formacao: "Análise e Desenvolvimento de Sistemas, 4º período, em andamento",
  idiomas: ["Português (nativo)", "Inglês"],
  email: "edu.hcdev@gmail.com",
  prazoResposta: "até 1 dia útil",
  github: "https://github.com/eduardohenrique-dev",
  linkedin: "https://www.linkedin.com/in/eduardohenriquecorrea",
} as const;

export const ABERTURA = {
  lead: "Faço software de ponta a ponta: entendo o problema, desenho a interface e coloco no ar. Os três últimos nasceram no mundo do League of Legends — dois para a operação de um time de esports, um para aulas particulares do jogo.",
  linha: "Full stack e UX/UI, em Governador Valadares (MG).",
};

export const SOBRE = {
  titulo: "Quem está nessa mesa",
  paragrafos: [
    "Sou o Eduardo, de Governador Valadares. Estou no 4º período de Análise e Desenvolvimento de Sistemas, mas o que mostro aqui não é exercício de curso: são ferramentas que times usam no dia a dia.",
    "Cuido do produto inteiro. Modelo os dados, desenho as telas e faço o deploy. Nos projetos da Ei Nerd, isso quis dizer permissão que vale no banco e não só na tela, dados de partida chegando de uma API com limite de requisições e um app de gestão com dez módulos.",
    "O código fala a língua de quem mantém. Quando o domínio é em português, componentes e props também são: BotaoGoogle, tema, proximo.",
    "O que me puxa agora é IA dentro de produto. O terminal mais abaixo responde perguntas sobre o meu trabalho usando a API do Claude. Preferi mostrar funcionando a escrever que sei fazer.",
  ],
  nota: [
    ["Onde", "Governador Valadares, MG"],
    ["Estudo", "ADS, 4º período"],
    ["Idiomas", "Português e inglês"],
  ] as [string, string][],
};

export const CONTATO = {
  titulo: "Escreva para mim",
  texto: "Conte o que você precisa, para quem é e até quando. Eu leio tudo e respondo em até 1 dia útil.",
};

export const COLOFAO =
  "Pixel art e fonte (Ibituruna) desenhadas em código, numa paleta de 8 cores que muda com o horário. Texto em Inter Tight. Feito com Next.js, GSAP e a API do Claude.";

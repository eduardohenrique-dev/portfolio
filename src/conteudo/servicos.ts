/**
 * Serviços, na ordem da trilha do mapa: do rascunho ao ar.
 * Cada parada diz o que eu faço, o que você recebe e onde já fiz — só com o que existe nos projetos.
 * Os ids casam com PARADAS em arte/sprites/mapa.ts.
 */
export interface Servico {
  id: "entender" | "desenhar" | "construir" | "conectar" | "publicar";
  nome: string;
  area: string;
  descricao: string;
  entregas: string[];
  onde: string;
}

export const SERVICOS: Servico[] = [
  {
    id: "entender",
    nome: "Entender",
    area: "UX: arquitetura e fluxos",
    descricao:
      "Antes de abrir o editor, entendo quem usa, o que precisa fazer e onde a rotina trava. Organizo o conteúdo e desenho o caminho de cada tarefa, do primeiro clique até o fim.",
    entregas: [
      "Mapa das telas e dos fluxos principais",
      "Arquitetura da informação: o que fica em cada tela e como se chega lá",
      "Protótipo funcionando, para testar a ideia cedo",
    ],
    onde: "No GVTEM, as 203 categorias herdadas do site antigo viraram 15 grupos. No EINERD HQ, a gestão do time virou dez módulos num app só.",
  },
  {
    id: "desenhar",
    nome: "Desenhar",
    area: "UI: interface e design system",
    descricao:
      "Telas claras para o uso de todo dia, no computador e no celular, com os estados de vazio, carregando e erro também desenhados. Tudo sai de um design system em código, para o produto crescer sem perder a cara.",
    entregas: [
      "Interface de cada tela, do celular ao monitor grande",
      "Design system em tokens: cores, tipos, espaços e componentes",
      "Acessibilidade no nível AA: contraste, teclado e movimento reduzido",
    ],
    onde: "O Deck Scanner tem o visual inteiro em tokens, com escala de texto, raios e sombras nomeados. O GVTEM ganhou identidade nova, com o logo vetorizado a partir da arte original. Este site tem fonte e pixel art próprias, com o contraste AA conferido por script nos quatro horários.",
  },
  {
    id: "construir",
    nome: "Construir",
    area: "Sistemas e plataformas sob medida",
    descricao:
      "O que hoje vive em planilha e mensagem solta vira sistema: cadastro, painel, permissões e atualização em tempo real. Também faço plataformas abertas ao público, com login, busca e área para quem publica.",
    entregas: [
      "Sistema web com login e papéis de acesso",
      "Permissão garantida no banco, não só na tela",
      "Painéis com indicadores tirados dos dados reais",
    ],
    onde: "O EINERD HQ junta a gestão de um time de esports, o Scrims transforma partidas em indicadores, o DGAMES controla estoque e lucro de uma loja e o GVTEM é um guia público com avaliações e painel para o dono do negócio.",
  },
  {
    id: "conectar",
    nome: "Conectar",
    area: "Dados e integrações",
    descricao:
      "Puxo dados de APIs de fora para dentro do sistema e transformo em informação útil, respeitando o limite de cada API e rodando sozinho, sem ninguém precisar apertar um botão.",
    entregas: ["Integração com APIs externas", "Rotinas agendadas que atualizam os dados sozinhas", "Regras de cálculo cobertas por teste"],
    onde: "O Scrims lê as partidas da API da GRID todo dia de madrugada, dentro do limite de 40 requisições por minuto, com 71 testes nas regras de cálculo. O Deck Scanner cruza o preço da Scryfall com a cotação do dólar do Banco Central.",
  },
  {
    id: "publicar",
    nome: "Publicar",
    area: "Deploy e infraestrutura",
    descricao:
      "O projeto não termina no código: eu publico, configuro banco, login e armazenamento de arquivos e deixo rodando. E quando um serviço cai, migro sem perder o que importa.",
    entregas: [
      "Publicação na hospedagem que fizer sentido para o projeto, escolhida junto com você",
      "Banco, login e arquivos configurados",
      "Custo sob controle, começando pelos planos gratuitos",
    ],
    onde: "Quando o plano gratuito do Supabase apagou o banco do GVTEM, o schema subiu no Neon sem alteração, o login foi para o Auth.js e as fotos para o Vercel Blob. O Deck Scanner roda inteiro nos planos gratuitos da Vercel, do Neon e do Cloudflare R2.",
  },
];

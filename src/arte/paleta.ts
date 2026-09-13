/**
 * Paleta fechada de 8 índices. O horário do dia não inventa cor nova:
 * troca o VALOR de cada índice, como palette swap de jogo de 16 bits.
 * A UI (tokens CSS) e a cena (canvas) leem daqui — fonte única.
 *
 * Papéis dos índices:
 * 0 fundo · 1 superfície · 2 linha · 3 âmbar · 4 sálvia · 5 rosa · 6 creme · 7 bruma
 */

export type Rgb = readonly [number, number, number];

export const INDICE = {
  fundo: 0,
  superficie: 1,
  linha: 2,
  ambar: 3,
  salvia: 4,
  rosa: 5,
  creme: 6,
  bruma: 7,
} as const;

export type NomeIndice = keyof typeof INDICE;

export const HORARIOS = ["tarde", "entardecer", "anoitecer", "noite"] as const;
export type Horario = (typeof HORARIOS)[number];

/** Ordem dos índices: fundo, superfície, linha, âmbar, sálvia, rosa, creme, bruma. */
export const PALETAS_HEX: Record<Horario, readonly string[]> = {
  // Luz de fim de tarde entrando pela janela: escuros puxados para o ameixa, luzes douradas.
  tarde: ["#2A2030", "#3A2C3D", "#5A4557", "#F0B45C", "#9AAE7E", "#DB8C7E", "#F6E8D0", "#B3A1AB"],
  // O sol encosta no horizonte: o rosa ganha espaço.
  entardecer: ["#241C2E", "#33283B", "#503F59", "#EBA75A", "#8CA582", "#D48088", "#F3E7D2", "#AA99AE"],
  // Resto de luz: tudo esfria, a luminária acende.
  anoitecer: ["#1E1A2A", "#2C2539", "#473D56", "#E7A858", "#83A183", "#CE7D86", "#F0E5D2", "#A094AA"],
  // Ponto de partida do briefing; só a bruma subiu (#8B8299 → #978EA5) para passar AA sobre a superfície.
  noite: ["#1A1826", "#262336", "#3D3752", "#E3A857", "#7E9E82", "#C97B84", "#EFE4D2", "#978EA5"],
};

export function hexParaRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const PALETAS = {
  tarde: PALETAS_HEX.tarde.map(hexParaRgb),
  entardecer: PALETAS_HEX.entardecer.map(hexParaRgb),
  anoitecer: PALETAS_HEX.anoitecer.map(hexParaRgb),
  noite: PALETAS_HEX.noite.map(hexParaRgb),
} satisfies Record<Horario, readonly Rgb[]>;

/**
 * Rampas de luz. Clarear/escurecer um pixel é andar um passo nessa tabela,
 * nunca misturar cores — assim a cena continua com exatamente 8 cores.
 * A luz aqui é quente (sol baixo e luminária), por isso a linha clareia para o rosa.
 */
export const CLAREAR = [1, 2, 5, 6, 3, 3, 6, 6] as const;
export const ESCURECER = [0, 0, 1, 5, 2, 2, 7, 2] as const;

/** Matriz de Bayer 4×4 normalizada (0..15). */
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** Índice transparente nos buffers de sprite. */
export const VAZIO = 255;

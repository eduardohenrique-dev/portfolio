/**
 * Mapa dos serviços: uma ilha com uma trilha pontilhada ligando cinco paradas — entender (UX),
 * desenhar (UI), construir, conectar e publicar. Duas composições, como a cena do quarto:
 * larga (tablet e desktop) e alta (celular).
 *
 * O mapa sai em camadas: o chão (ilha, árvores, clareiras, plataforma do foguete), a trilha
 * (separada para ser desenhada aos poucos) e um marco por parada, com dois quadros de animação.
 */
import { BAYER4 } from "../../src/arte/paleta";
import { CORES } from "../cena/sprites";
import { Pincel } from "./pincel";

const { F, S, L, A, V, R, C, B } = CORES;

type Ponto = readonly [number, number];

/** Paradas na ordem da trilha; os ids casam com src/conteudo/servicos.ts. */
export const PARADAS = ["entender", "desenhar", "construir", "conectar", "publicar"] as const;

export const COMPOSICOES_MAPA = {
  larga: {
    largura: 300,
    altura: 104,
    paradas: [
      [34, 76],
      [92, 64],
      [150, 78],
      [208, 64],
      [266, 74],
    ],
  },
  alta: {
    largura: 160,
    altura: 244,
    paradas: [
      [46, 44],
      [114, 88],
      [46, 132],
      [114, 176],
      [58, 222],
    ],
  },
} as const satisfies Record<string, { largura: number; altura: number; paradas: readonly Ponto[] }>;

export type ComposicaoMapa = keyof typeof COMPOSICOES_MAPA;

// ——— trilha ———

/** Catmull-Rom pelas paradas, reamostrada a cada 1px de comprimento. Devolve os pontos e o índice de cada parada. */
function tracarCaminho(paradas: readonly Ponto[]): { pontos: [number, number][]; indices: number[] } {
  const P = [paradas[0], ...paradas, paradas[paradas.length - 1]];
  const bruto: [number, number][] = [];
  const marcos: number[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    if (i === 1) marcos.push(0);
    for (let k = 0; k < 60; k++) {
      const t = k / 60;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      bruto.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    marcos.push(bruto.length);
  }
  bruto.push([...P[P.length - 2]] as [number, number]);
  // reamostra por comprimento de arco
  const pontos: [number, number][] = [bruto[0]];
  const indices: number[] = [0];
  let acumulado = 0;
  let proximo = 1;
  let marcoAtual = 1;
  for (let i = 1; i < bruto.length; i++) {
    const [x0, y0] = bruto[i - 1];
    const [x1, y1] = bruto[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    while (acumulado + seg >= proximo) {
      const t = (proximo - acumulado) / seg;
      pontos.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      proximo += 1;
    }
    acumulado += seg;
    if (marcoAtual < marcos.length && i === marcos[marcoAtual]) {
      indices.push(pontos.length - 1);
      marcoAtual++;
    }
  }
  if (indices.length < paradas.length) indices.push(pontos.length - 1);
  return { pontos: pontos.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]), indices };
}

function sorteio(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Distância com sinal até a borda de um retângulo de cantos redondos (negativa dentro). */
function sdfRetangulo(x: number, y: number, cx: number, cy: number, meiaL: number, meiaA: number, raio: number) {
  const qx = Math.abs(x - cx) - meiaL + raio;
  const qy = Math.abs(y - cy) - meiaA + raio;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - raio;
}

const PINHEIRO = ["...F...", "..FSF..", ".FSLSF.", "..FSF..", ".FSSSF.", "FSSLSSF", ".FFFFF.", "..FLF..", "...F..."];
const PEDRA = [".LL.", "LBCL", "LBBL", ".LL."];

export interface MapaExportado {
  chao: Pincel;
  trilha: Pincel;
  pontos: [number, number][];
  indices: number[];
}

export function montarMapa(composicao: ComposicaoMapa): MapaExportado {
  const { largura: W, altura: H, paradas } = COMPOSICOES_MAPA[composicao];
  const { pontos, indices } = tracarCaminho(paradas);
  const chao = new Pincel(W, H);

  // ilha: chão, areia e água pontilhada até sumir na página
  const cx = W / 2;
  const cy = H / 2;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const ruido = Math.sin(x * 0.21 + y * 0.05) * 1.3 + Math.sin(y * 0.33 + x * 0.07) * 1.1 + Math.sin((x + y) * 0.13) * 0.8;
      const d = sdfRetangulo(x + 0.5, y + 0.5, cx, cy, W / 2 - 3, H / 2 - 3, 16) + ruido;
      const limiar = (BAYER4[y & 3][x & 3] + 0.5) / 16;
      if (d < -5) chao.px(x, y, V);
      else if (d < -3) chao.px(x, y, A);
      else if (d < -1.5) chao.px(x, y, B);
      else if (d < 1.5 && limiar < (1.5 - d) / 3) chao.px(x, y, B);
    }

  const perto = (x: number, y: number, raio: number) => pontos.some(([px, py]) => Math.abs(px - x) < raio && Math.abs(py - y) < raio);
  const ocupado = (x: number, y: number) =>
    paradas.some(([px, py]) => (Math.abs(x - px) < 18 && y > py - 36 && y < py + 4) || (Math.abs(x - px) < 28 && y > py + 4 && y < py + 22));
  const dentro = (x: number, y: number) => chao.dados[y * W + x] === V;

  // textura do chão: tufos de grama
  const aleatorio = sorteio(composicao === "larga" ? 7 : 11);
  for (let i = 0; i < (W * H) / 180; i++) {
    const x = Math.floor(aleatorio() * W);
    const y = Math.floor(aleatorio() * H);
    if (!dentro(x, y) || !dentro(x + 2, y) || perto(x, y, 4)) continue;
    chao.px(x, y, L);
    chao.px(x + 1, y - 1, L);
    chao.px(x + 2, y, L);
  }

  // clareira de terra em cada parada
  for (const [px, py] of paradas)
    for (let j = -4; j <= 4; j++)
      for (let i = -8; i <= 8; i++)
        if ((i * i) / 64 + (j * j) / 16 <= 1 && (BAYER4[(py + j) & 3][(px + i) & 3] + 0.5) / 16 < 0.6) chao.px(px + i, py + j, A);

  // pinheiros e pedras longe da trilha, dos marcos e dos nomes
  for (let i = 0; i < (composicao === "larga" ? 90 : 70); i++) {
    const x = Math.floor(aleatorio() * (W - 8));
    const y = Math.floor(aleatorio() * (H - 10));
    const pedra = aleatorio() < 0.3;
    const [w, h] = pedra ? [4, 4] : [7, 9];
    let livre = true;
    for (let j = 0; j < h && livre; j++) for (let k = 0; k < w && livre; k++) if (!dentro(x + k, y + j) || ocupado(x + k, y + j)) livre = false;
    if (!livre || perto(x + w / 2, y + h / 2, 9)) continue;
    chao.desenho(pedra ? PEDRA : PINHEIRO, x, y);
  }

  // plataforma do foguete na última parada
  const [fx, fy] = paradas[paradas.length - 1];
  chao.ret(fx - 9, fy - 5, 18, 4, L);
  chao.ret(fx - 8, fy - 5, 16, 1, B);
  chao.ret(fx - 8, fy - 1, 2, 2, L);
  chao.ret(fx + 6, fy - 1, 2, 2, L);

  // trilha: pontos de 2×2 a cada 5px, com sombra
  const trilha = new Pincel(W, H);
  for (let s = 0; s < pontos.length; s += 5) {
    const [x, y] = pontos[Math.round(s)];
    const px = Math.round(x) - 1;
    const py = Math.round(y) - 1;
    trilha.ret(px, py + 2, 2, 1, L);
    trilha.ret(px, py, 2, 2, C);
  }
  return { chao, trilha, pontos, indices };
}

// ——— marcos (26×28, dois quadros) ———

function traco(p: Pincel, x0: number, y0: number, x1: number, y1: number, cor: number, espessura = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / Math.max(1, n));
    const y = Math.round(y0 + ((y1 - y0) * i) / Math.max(1, n));
    p.ret(x - Math.floor(espessura / 2), y - Math.floor(espessura / 2), espessura, espessura, cor);
  }
}

/** Entender (UX): luneta no tripé. No quadro 1 ela vira para o outro lado. */
export function marcoEntender(quadro: 0 | 1): Pincel {
  const p = new Pincel(26, 28);
  traco(p, 13, 16, 7, 27, L);
  traco(p, 13, 16, 19, 27, L);
  traco(p, 13, 16, 13, 27, S);
  p.ret(11, 15, 5, 3, F);
  const [x0, y0, x1, y1] = quadro === 0 ? [7, 17, 21, 7] : [19, 17, 5, 7];
  traco(p, x0, y0, x1, y1, F, 5);
  traco(p, x0, y0, x1, y1, B, 3);
  traco(p, x0, y0 - 1, x1, y1 - 1, C);
  p.circulo(x1, y1, 2, F);
  p.circulo(x1, y1, 1, A);
  return p;
}

/** Desenhar (UI): cavalete. Quadro 0 é o rascunho; no 1 a tela já tem as cores da interface. */
export function marcoDesenhar(quadro: 0 | 1): Pincel {
  const p = new Pincel(26, 28);
  traco(p, 13, 12, 13, 27, S);
  traco(p, 11, 6, 6, 27, L, 2);
  traco(p, 15, 6, 20, 27, L, 2);
  p.caixa(3, 3, 20, 15, C, F);
  if (quadro === 0) {
    p.borda(5, 5, 16, 3, L);
    p.borda(5, 9, 7, 7, L);
    p.ret(14, 9, 7, 1, L);
    p.ret(14, 12, 5, 1, L);
    p.ret(14, 15, 6, 1, L);
  } else {
    p.ret(5, 5, 16, 3, R);
    p.ret(5, 9, 7, 7, A);
    p.ret(14, 9, 7, 2, V);
    p.ret(14, 12, 7, 2, B);
    p.ret(14, 15, 4, 1, L);
  }
  p.ret(4, 19, 18, 2, L);
  p.ret(5, 19, 16, 1, B);
  return p;
}

function engrenagem(p: Pincel, cx: number, cy: number, girada: boolean, cor: number) {
  const dentes = girada
    ? [
        [-3, -3],
        [3, -3],
        [-3, 3],
        [3, 3],
      ]
    : [
        [0, -4],
        [0, 4],
        [-4, 0],
        [4, 0],
      ];
  for (const [dx, dy] of dentes) p.ret(cx + dx - 1, cy + dy - 1, 2, 2, cor);
  p.circulo(cx, cy, 3, cor);
  p.px(cx, cy, F);
}

/** Construir: oficina com a engrenagem na fachada. No quadro 1 a engrenagem gira e a chaminé solta fumaça. */
export function marcoConstruir(quadro: 0 | 1): Pincel {
  const p = new Pincel(26, 28);
  // chaminé e fumaça
  p.ret(18, 4, 4, 8, F);
  p.ret(19, 5, 2, 7, L);
  if (quadro === 1) {
    p.ret(19, 1, 3, 2, B);
    p.ret(21, 0, 2, 1, C);
  }
  // telhado
  for (let i = 0; i <= 12; i++) p.ret(1 + i, 12 - Math.floor(i * 0.75), 25 - 2 * i, 1, i === 0 ? F : R);
  traco(p, 0, 12, 13, 2, F);
  traco(p, 13, 2, 25, 12, F);
  // paredes, porta e janela
  p.caixa(2, 12, 22, 16, C, F);
  p.ret(3, 13, 20, 1, B);
  p.ret(4, 17, 5, 5, F);
  p.ret(5, 18, 3, 3, B);
  p.ret(10, 18, 6, 10, F);
  p.ret(11, 19, 4, 9, L);
  p.px(14, 23, A);
  engrenagem(p, 19, 20, quadro === 1, A);
  return p;
}

/** Conectar: antena de treliça. No quadro 1 a luz acende e as ondas saem do topo. */
export function marcoConectar(quadro: 0 | 1): Pincel {
  const p = new Pincel(26, 28);
  traco(p, 7, 27, 12, 6, F, 2);
  traco(p, 19, 27, 14, 6, F, 2);
  for (let y = 10; y < 26; y += 4) {
    const a = 12 - Math.round(((y - 6) / 21) * 5);
    const b = 14 + Math.round(((y - 6) / 21) * 5);
    traco(p, a, y, b, y + 4, L);
    traco(p, b, y, a, y + 4, L);
  }
  p.ret(12, 4, 3, 3, F);
  p.px(13, 5, quadro === 1 ? A : L);
  if (quadro === 1) {
    for (const [r, cor] of [
      [5, C],
      [9, B],
    ] as const)
      for (let a = -0.9; a <= 0.9; a += 0.08) {
        p.px(Math.round(13 + Math.cos(a) * r), Math.round(5 + Math.sin(a) * r), cor);
        p.px(Math.round(13 - Math.cos(a) * r), Math.round(5 + Math.sin(a) * r), cor);
      }
  }
  return p;
}

/** Publicar: o foguete (a plataforma fica no chão do mapa). No quadro 1 o motor está aceso. */
export function marcoPublicar(quadro: 0 | 1): Pincel {
  const p = new Pincel(18, 30);
  // fogo
  if (quadro === 1) {
    p.ret(7, 23, 4, 4, A);
    p.ret(8, 27, 2, 3, R);
    p.px(6, 24, R);
    p.px(11, 24, R);
  }
  // aletas
  p.ret(2, 16, 4, 7, F);
  p.ret(3, 17, 3, 5, R);
  p.ret(12, 16, 4, 7, F);
  p.ret(12, 17, 3, 5, R);
  // corpo e bico
  p.caixa(5, 7, 8, 16, C, F);
  p.ret(11, 8, 1, 14, B);
  for (let i = 0; i < 6; i++) p.ret(9 - Math.ceil(i / 2), 1 + i, 1 + 2 * Math.ceil(i / 2), 1, i === 0 ? F : R);
  traco(p, 9, 0, 5, 7, F);
  traco(p, 9, 0, 13, 7, F);
  p.circulo(9, 12, 2, F);
  p.circulo(9, 12, 1, B);
  p.ret(6, 21, 6, 1, L);
  return p;
}

export const MARCOS = {
  entender: marcoEntender,
  desenhar: marcoDesenhar,
  construir: marcoConstruir,
  conectar: marcoConectar,
  publicar: marcoPublicar,
} as const;

/** Linha do sprite do foguete onde ele toca a plataforma (abaixo dela só existe o fogo). */
export const BASE_FOGUETE = 23;

/** Onde cada marco fica: centrado na parada, com a base logo acima da trilha (o foguete, em cima da plataforma). */
export function posicaoMarco(parada: Ponto, largura: number, altura: number, foguete: boolean): Ponto {
  return [parada[0] - Math.floor(largura / 2), foguete ? parada[1] - 5 - BASE_FOGUETE : parada[1] - 3 - altura];
}


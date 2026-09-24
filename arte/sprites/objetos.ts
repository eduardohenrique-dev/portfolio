/**
 * Objetos desenhados por código: os projetos na prateleira, o personagem da
 * trajetória, ícones do HUD, cartão-postal, selo e favicon. Os cursores ficam em cursores.ts.
 */
import { CORES } from "../cena/sprites";
import { Pincel } from "./pincel";

const { F, S, L, A, V, R, C, B } = CORES;

/** Cartucho — EINERD Scrims (treino é partida: VS no rótulo). */
export function cartucho(): Pincel {
  const p = new Pincel(30, 36);
  // corpo com cantos superiores chanfrados
  p.ret(2, 0, 26, 1, L);
  p.ret(1, 1, 28, 1, L);
  p.ret(0, 2, 30, 30, L);
  p.ret(2, 1, 26, 1, B);
  p.ret(1, 2, 28, 29, B);
  // brilho na borda esquerda e sombra na direita
  p.ret(1, 3, 1, 27, C);
  p.ret(28, 3, 1, 27, S);
  // ranhuras de pegada
  for (const x of [5, 8, 11, 18, 21, 24]) p.ret(x, 3, 1, 3, L);
  // rótulo
  p.ret(4, 8, 22, 17, C);
  p.ret(5, 9, 20, 15, A);
  const w = Pincel.larguraMini("VS", 2);
  p.mini("VS", 5 + Math.floor((20 - w) / 2), 11, F, 2);
  p.ret(7, 22, 16, 1, R);
  // conector
  p.ret(0, 32, 30, 4, L);
  p.ret(3, 31, 24, 4, S);
  for (let x = 4; x < 26; x += 2) p.ret(x, 32, 1, 3, A);
  return p;
}

/** Fichário — EINERD HQ (a operação inteira arquivada num lugar só). */
export function fichario(): Pincel {
  const p = new Pincel(26, 42);
  p.caixa(0, 0, 26, 42, R, L);
  p.ret(2, 1, 1, 40, C); // curvatura da lombada
  p.ret(23, 1, 2, 40, L);
  // etiqueta
  p.ret(5, 6, 16, 14, L);
  p.ret(6, 7, 14, 12, C);
  const w = Pincel.larguraMini("HQ", 2);
  p.mini("HQ", 6 + Math.floor((14 - w) / 2), 8, F, 2);
  // furo de puxar
  p.circulo(13, 30, 3, L);
  p.circulo(13, 30, 2, F);
  // faixa
  p.ret(1, 36, 22, 2, A);
  return p;
}

/** Guia dobrado — GVTEM (o mapa da cidade, com o alfinete no negócio). */
export function guia(): Pincel {
  const p = new Pincel(30, 40);
  // aba da capa com GV
  p.ret(0, 0, 13, 7, L);
  p.ret(1, 1, 11, 6, A);
  p.mini("GV", 3, 1, F);
  // folha aberta em três painéis; a sombra depois de cada dobra marca o papel dobrado
  p.caixa(0, 6, 30, 34, C, L);
  p.ret(10, 7, 1, 32, L);
  p.ret(11, 7, 1, 32, B);
  p.ret(20, 7, 1, 32, L);
  p.ret(21, 7, 1, 32, B);
  // rio Doce atravessando os três painéis
  for (let x = 1; x < 29; x++) {
    const y = 29 + Math.round(Math.sin(x / 4) * 2);
    p.ret(x, y, 1, 3, V);
  }
  // ruas
  p.ret(1, 16, 28, 1, L);
  p.ret(6, 7, 1, 21, L);
  p.ret(25, 11, 1, 17, L);
  for (let i = 0; i < 7; i++) p.px(13 + i, 24 - i, L);
  // praça
  p.ret(2, 19, 3, 3, V);
  // alfinete no negócio
  p.circulo(16, 11, 3, F);
  p.circulo(16, 11, 2, R);
  p.px(15, 10, C);
  p.ret(16, 14, 1, 3, F);
  return p;
}

/** Caixa de deck com uma carta saindo, no visor da câmera — Deck Scanner. */
export function caixaDeck(): Pincel {
  const p = new Pincel(28, 42);
  // carta (verso) subindo da caixa
  p.caixa(6, 3, 16, 16, R, L);
  p.circulo(14, 10, 4, A);
  p.circulo(14, 10, 2, R);
  // cantos do visor da câmera em volta da carta
  p.ret(3, 0, 4, 1, A);
  p.ret(3, 0, 1, 4, A);
  p.ret(21, 0, 4, 1, A);
  p.ret(24, 0, 1, 4, A);
  // caixa
  p.caixa(1, 14, 26, 28, L, F);
  p.ret(2, 15, 24, 2, S);
  p.ret(2, 17, 1, 24, B);
  // etiqueta com as cinco cores de mana
  p.ret(3, 23, 22, 11, C);
  [C, B, F, R, V].forEach((cor, i) => {
    p.ret(5 + i * 4, 25, 3, 3, L);
    if (cor !== C) p.ret(5 + i * 4, 25, 3, 3, cor);
    else p.ret(6 + i * 4, 26, 1, 1, A);
  });
  p.ret(5, 31, 18, 1, L);
  return p;
}

/** Caixa de papelão da loja com o D da marca e etiqueta de preço — DGAMES. */
export function caixaLoja(): Pincel {
  const p = new Pincel(34, 36);
  // abas de cima
  p.ret(2, 6, 28, 4, L);
  p.ret(3, 7, 26, 3, A);
  p.ret(3, 9, 26, 1, R);
  // corpo
  p.caixa(1, 10, 30, 26, A, L);
  p.degrade(2, 30, 28, 5, [A, R]);
  // fita
  p.ret(14, 6, 4, 29, C);
  p.ret(14, 6, 1, 29, B);
  // logo: quadrado rosa com D
  p.ret(3, 14, 10, 14, F);
  p.ret(4, 15, 8, 12, R);
  p.mini("D", 5, 16, C, 2);
  // etiqueta de preço pendurada
  p.ret(27, 0, 1, 12, L);
  p.caixa(24, 11, 9, 13, C, L);
  p.px(28, 13, L);
  p.ret(26, 17, 5, 1, L);
  p.ret(26, 19, 4, 1, L);
  p.ret(26, 21, 5, 1, B);
  return p;
}

/** Personagem da trajetória: parado + 4 quadros de caminhada, virado para a direita. */
export function andarilho(): Pincel[] {
  const cabeca = ["....SSSSS...", "...SSSSSSS..", "...SSSCCCC..", "...SSCCFCC..", "....SCCCCC..", ".....CCCC..."];
  const tronco = ["...VVVVVVV..", "..VVVVVVVVV.", "..VVVVVVVVV.", "..VCVVVVVVV.", "...VVVVVVV..", "...LLLLLLL.."];
  const pernas = {
    parado: ["...LLL.LLL..", "...LL...LL..", "...LL...LL..", "...LL...LL..", "..FFF..FFF.."],
    passo: ["...LLL.LLL..", "..LL....LL..", "..LL.....LL.", ".LL......LL.", ".FFF.....FFF"],
    junto: ["....LLLLL...", "....LLLL....", "....LLL.....", "....LLL.....", "...FFFF....."],
  };
  const quadro = (p: readonly string[], sobe: boolean) => {
    const pincel = new Pincel(12, 18);
    const oy = sobe ? 0 : 1;
    pincel.desenho([...cabeca, ...tronco], 0, oy);
    pincel.desenho(p, 0, 12 + oy);
    return pincel;
  };
  return [
    quadro(pernas.parado, false),
    quadro(pernas.passo, false),
    quadro(pernas.junto, true),
    quadro(pernas.passo, false),
    quadro(pernas.junto, true),
  ];
}

export function marco(): Pincel {
  const p = new Pincel(12, 16);
  p.caixa(0, 0, 12, 7, A, L);
  p.ret(2, 3, 8, 1, R);
  p.ret(5, 7, 2, 7, R);
  p.ret(6, 7, 1, 7, L);
  p.ret(3, 14, 6, 2, L);
  return p;
}

export function iconeSol(): Pincel {
  const p = new Pincel(11, 11);
  p.desenho(
    [
      ".....A.....",
      ".A.......A.",
      "...........",
      "....CCC....",
      "...CCCCC...",
      "A..CCCCC..A",
      "...CCCCC...",
      "....CCC....",
      "...........",
      ".A.......A.",
      ".....A.....",
    ],
    0,
    0,
  );
  return p;
}

export function iconePorDoSol(): Pincel {
  const p = new Pincel(11, 11);
  p.desenho(
    [
      "...........",
      "...........",
      ".....A.....",
      ".A.......A.",
      "....AAA....",
      "...AAAAA...",
      "...AAAAA...",
      "LLLLLLLLLLL",
      "...........",
      "..LLLLLLL..",
      "...........",
    ],
    0,
    0,
  );
  return p;
}

export function iconeLua(): Pincel {
  const p = new Pincel(11, 11);
  p.desenho(
    [
      "....CCC....",
      "..CCCC.....",
      ".CCCC......",
      ".CCC.......",
      "CCCC.....B.",
      "CCCC.......",
      "CCCC.......",
      ".CCCC......",
      ".CCCCC...C.",
      "..CCCCCCC..",
      "....CCC....",
    ],
    0,
    0,
  );
  return p;
}

/** Frente do cartão-postal: Ibituruna no fim de tarde, Rio Doce e um parapente. */
export function postal(montanha: readonly string[]): Pincel {
  const W = 120;
  const H = 76;
  const p = new Pincel(W, H);
  p.degrade(0, 0, W, 52, [B, R, A]);
  // sol baixo atrás da montanha
  p.circulo(34, 44, 6, C);
  // montanha ampliada 2×
  const altura = montanha.length;
  const largura = Math.max(...montanha.map((l) => l.length));
  const ox = 30;
  const oy = 54 - altura * 2;
  montanha.forEach((linha, j) => {
    for (let i = 0; i < largura; i++) if (linha[i] && linha[i] !== ".") p.ret(ox + i * 2, oy + j * 2, 2, 2, L);
  });
  // serra ao fundo, à esquerda
  for (let x = 0; x < 34; x++) {
    const h = Math.round(6 + 3 * Math.sin(x / 5));
    p.ret(x, 54 - h, 1, h, S);
  }
  // cidade
  p.ret(0, 54, W, 6, L);
  for (let x = 2; x < W; x += 5) p.px(x, 55 + ((x * 7) % 3), A);
  // Rio Doce
  p.ret(0, 60, W, 16, S);
  for (let y = 62; y < H; y += 3)
    for (let x = (y * 11) % 7; x < W; x += 9) {
      p.ret(x, y, 3, 1, B);
    }
  // reflexo do sol
  for (let y = 61; y < 72; y += 2) p.ret(31 + ((y * 3) % 3), y, 6 - ((y - 61) >> 2), 1, A);
  // parapente
  p.desenho(["..CCCCC..", ".C.....C.", "..L...L..", "...L.L...", "....S...."], 84, 16);
  return p;
}

/** Selo com o gato dormindo. */
export function selo(gato: readonly string[]): Pincel {
  const p = new Pincel(28, 32);
  p.ret(0, 0, 28, 32, C);
  // picote
  for (let x = 1; x < 28; x += 3) {
    p.px(x, 0, F);
    p.px(x, 31, F);
  }
  for (let y = 1; y < 32; y += 3) {
    p.px(0, y, F);
    p.px(27, y, F);
  }
  p.ret(3, 3, 22, 26, R);
  p.degrade(4, 4, 20, 14, [A, R]);
  p.desenho(gato, 6, 14);
  p.mini("GV", 4, 23, C);
  return p;
}

export function favicon(): Pincel {
  const p = new Pincel(16, 16);
  p.ret(0, 0, 16, 16, F);
  p.desenho(
    [
      "................",
      "................",
      ".......LL.......",
      ".....LLRRLL.....",
      "....LRRRRRRL....",
      "...LRRAAAARRL...",
      "....LLCCCCLL....",
      "................",
      ".....A.A.A.A....",
      "....A.A.A.A.A...",
      "...A.A.A.A.A.A..",
      "..A.A.A.A.A.A.A.",
      "................",
      "..LLLLLLLLLLLL..",
      "..SSSSSSSSSSSS..",
      "................",
    ],
    0,
    0,
  );
  return p;
}

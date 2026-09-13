/**
 * Pincel para desenhar sprites por código em grade inteira.
 */
import { BAYER4, VAZIO } from "../../src/arte/paleta";
import { CORES_TEXTO } from "../util";

const MINI: Record<string, readonly string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  V: ["#.#", "#.#", "#.#", ".#.", ".#."],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "6": [".##", "#..", "###", "#.#", "###"],
};

export class Pincel {
  readonly dados: Uint8Array;
  constructor(
    readonly largura: number,
    readonly altura: number,
  ) {
    this.dados = new Uint8Array(largura * altura).fill(VAZIO);
  }

  px(x: number, y: number, cor: number) {
    if (x < 0 || y < 0 || x >= this.largura || y >= this.altura) return;
    this.dados[y * this.largura + x] = cor;
  }

  ret(x: number, y: number, w: number, h: number, cor: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, cor);
  }

  borda(x: number, y: number, w: number, h: number, cor: number) {
    for (let i = 0; i < w; i++) {
      this.px(x + i, y, cor);
      this.px(x + i, y + h - 1, cor);
    }
    for (let j = 0; j < h; j++) {
      this.px(x, y + j, cor);
      this.px(x + w - 1, y + j, cor);
    }
  }

  /** Retângulo com cantos chanfrados de 1px (canto "arredondado" desenhado em pixel). */
  caixa(x: number, y: number, w: number, h: number, fundo: number, contorno: number) {
    this.ret(x + 1, y + 1, w - 2, h - 2, fundo);
    for (let i = 1; i < w - 1; i++) {
      this.px(x + i, y, contorno);
      this.px(x + i, y + h - 1, contorno);
    }
    for (let j = 1; j < h - 1; j++) {
      this.px(x, y + j, contorno);
      this.px(x + w - 1, y + j, contorno);
    }
  }

  /** Degradê vertical pontilhado entre faixas de cor. */
  degrade(x: number, y: number, w: number, h: number, faixas: number[]) {
    const n = faixas.length - 1;
    for (let j = 0; j < h; j++) {
      const pos = (j / Math.max(1, h - 1)) * n;
      const baixo = Math.min(n - 1, Math.floor(pos));
      const frac = pos - baixo;
      for (let i = 0; i < w; i++) {
        const limiar = (BAYER4[(y + j) & 3][(x + i) & 3] + 0.5) / 16;
        this.px(x + i, y + j, frac > limiar ? faixas[baixo + 1] : faixas[baixo]);
      }
    }
  }

  circulo(cx: number, cy: number, r: number, cor: number) {
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) this.px(cx + i, cy + j, cor);
  }

  desenho(linhas: readonly string[], x: number, y: number, escala = 1) {
    linhas.forEach((linha, j) => {
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === "." || ch === " ") continue;
        const cor = CORES_TEXTO[ch];
        if (cor === undefined) throw new Error(`letra '${ch}' fora da paleta`);
        for (let dy = 0; dy < escala; dy++) for (let dx = 0; dx < escala; dx++) this.px(x + i * escala + dx, y + j * escala + dy, cor);
      }
    });
  }

  /** Texto na mini fonte 3×5 (só maiúsculas usadas nos rótulos). */
  mini(texto: string, x: number, y: number, cor: number, escala = 1) {
    let cx = x;
    for (const ch of texto) {
      if (ch === " ") {
        cx += 2 * escala;
        continue;
      }
      const g = MINI[ch];
      if (!g) throw new Error(`mini fonte sem '${ch}'`);
      for (let j = 0; j < 5; j++)
        for (let i = 0; i < 3; i++)
          if (g[j][i] === "#")
            for (let dy = 0; dy < escala; dy++) for (let dx = 0; dx < escala; dx++) this.px(cx + i * escala + dx, y + j * escala + dy, cor);
      cx += 4 * escala;
    }
  }

  static larguraMini(texto: string, escala = 1): number {
    let w = 0;
    for (const ch of texto) w += ch === " " ? 2 : 4;
    return (w - 1) * escala;
  }

  espelhar(): Pincel {
    const p = new Pincel(this.largura, this.altura);
    for (let y = 0; y < this.altura; y++)
      for (let x = 0; x < this.largura; x++) p.dados[y * this.largura + (this.largura - 1 - x)] = this.dados[y * this.largura + x];
    return p;
  }
}

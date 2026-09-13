/**
 * Rasterizador isométrico 2:1 para pixel art.
 *
 * Projeção: sx = ox + 2(x − y), sy = oy + (x + y) − z
 *  - x anda para a direita-baixo, y para a esquerda-baixo (1 unidade = 2px × 1px)
 *  - z é em pixels de altura
 * O raio de visão tem direção (1, 1, 2); profundidade = x + y + z cresce na direção do observador.
 *
 * Cada pixel guarda cor, profundidade, objeto, face e posição no mundo.
 * A posição no mundo é o que permite calcular luz de sol e luminária
 * com sombra de verdade na hora do build.
 */
import { VAZIO } from "../src/arte/paleta";

export const FACE = { nenhuma: 0, topo: 1, esquerda: 2, direita: 3, sprite: 4 } as const;

/** Normal de cada face (a face "esquerda" na tela é o plano y = y1; a "direita", x = x1). */
export const NORMAIS: Record<number, [number, number, number]> = {
  [FACE.topo]: [0, 0, 1],
  [FACE.esquerda]: [0, 1, 0],
  [FACE.direita]: [1, 0, 0],
  [FACE.sprite]: [0.45, 0.45, 0.77],
};

export interface Amostra {
  /** posição no mundo */
  x: number;
  y: number;
  z: number;
  face: number;
  /** coordenadas locais da face, a partir do canto de menor coordenada */
  u: number;
  v: number;
  /** extensão da face em u e v */
  lu: number;
  lv: number;
  /** pixel de tela */
  sx: number;
  sy: number;
}

export type Material = number | ((a: Amostra) => number);

export interface Caixa {
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  topo?: Material;
  esquerda?: Material;
  direita?: Material;
  camada?: number;
  /** projeta sombra (padrão: true) */
  sombra?: boolean;
  nome?: string;
}

export interface CaixaRegistrada extends Required<Pick<Caixa, "x0" | "y0" | "z0" | "x1" | "y1" | "z1">> {
  id: number;
  camada: number;
  sombra: boolean;
  nome: string;
}

function resolver(m: Material | undefined, a: Amostra): number {
  if (m === undefined) return VAZIO;
  return typeof m === "number" ? m : m(a);
}

export class Tela {
  readonly cor: Uint8Array;
  readonly prof: Float32Array;
  readonly obj: Int16Array;
  readonly face: Uint8Array;
  readonly camada: Int8Array;
  readonly mx: Float32Array;
  readonly my: Float32Array;
  readonly mz: Float32Array;
  readonly caixas: CaixaRegistrada[] = [];
  /** pixels que acendem sozinhos: 7 = sempre (tela do monitor), 4 = só com a luminária ligada */
  readonly emissivo: Uint8Array;
  /** quando definido, só rasteriza objetos dessa camada (as caixas continuam registradas para sombra) */
  somenteCamada: number | null = null;

  constructor(
    readonly w: number,
    readonly h: number,
    readonly ox: number,
    readonly oy: number,
  ) {
    const n = w * h;
    this.cor = new Uint8Array(n).fill(VAZIO);
    this.prof = new Float32Array(n).fill(-Infinity);
    this.obj = new Int16Array(n).fill(-1);
    this.face = new Uint8Array(n);
    this.camada = new Int8Array(n).fill(-1);
    this.mx = new Float32Array(n);
    this.my = new Float32Array(n);
    this.mz = new Float32Array(n);
    this.emissivo = new Uint8Array(n);
  }

  projetar(x: number, y: number, z: number): [number, number] {
    return [this.ox + 2 * (x - y), this.oy + (x + y) - z];
  }

  private escrever(
    i: number,
    cor: number,
    prof: number,
    obj: number,
    face: number,
    camada: number,
    x: number,
    y: number,
    z: number,
    emissivo: number,
  ) {
    if (prof <= this.prof[i]) return;
    this.prof[i] = prof;
    this.cor[i] = cor;
    this.obj[i] = obj;
    this.face[i] = face;
    this.camada[i] = camada;
    this.mx[i] = x;
    this.my[i] = y;
    this.mz[i] = z;
    this.emissivo[i] = emissivo;
  }

  caixa(c: Caixa & { emissivo?: (a: Amostra) => number }): CaixaRegistrada {
    const reg: CaixaRegistrada = {
      x0: c.x0,
      y0: c.y0,
      z0: c.z0,
      x1: c.x1,
      y1: c.y1,
      z1: c.z1,
      id: this.caixas.length,
      camada: c.camada ?? 0,
      sombra: c.sombra ?? true,
      nome: c.nome ?? "",
    };
    this.caixas.push(reg);
    if (this.somenteCamada !== null && this.somenteCamada !== reg.camada) return reg;

    const cantos: [number, number][] = [];
    for (const x of [c.x0, c.x1])
      for (const y of [c.y0, c.y1]) for (const z of [c.z0, c.z1]) cantos.push(this.projetar(x, y, z));
    const minX = Math.max(0, Math.floor(Math.min(...cantos.map((p) => p[0]))) - 1);
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(...cantos.map((p) => p[0]))) + 1);
    const minY = Math.max(0, Math.floor(Math.min(...cantos.map((p) => p[1]))) - 1);
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...cantos.map((p) => p[1]))) + 1);

    const a: Amostra = { x: 0, y: 0, z: 0, face: 0, u: 0, v: 0, lu: 0, lv: 0, sx: 0, sy: 0 };

    for (let sy = minY; sy <= maxY; sy++) {
      for (let sx = minX; sx <= maxX; sx++) {
        const u = sx - this.ox + 0.5;
        const v = sy - this.oy + 0.5;
        let melhor = -Infinity;
        let face = 0;
        let wx = 0;
        let wy = 0;
        let wz = 0;

        // topo (z = z1)
        if (c.topo !== undefined) {
          const X = (u / 2 + v + c.z1) / 2;
          const Y = (v + c.z1 - u / 2) / 2;
          if (X >= c.x0 && X < c.x1 && Y >= c.y0 && Y < c.y1) {
            const d = X + Y + c.z1;
            if (d > melhor) {
              melhor = d;
              face = FACE.topo;
              wx = X;
              wy = Y;
              wz = c.z1;
            }
          }
        }
        // face esquerda da tela (plano y = y1)
        if (c.esquerda !== undefined) {
          const X = u / 2 + c.y1;
          const Z = X + c.y1 - v;
          if (X >= c.x0 && X < c.x1 && Z >= c.z0 && Z < c.z1) {
            const d = X + c.y1 + Z;
            if (d > melhor) {
              melhor = d;
              face = FACE.esquerda;
              wx = X;
              wy = c.y1;
              wz = Z;
            }
          }
        }
        // face direita da tela (plano x = x1)
        if (c.direita !== undefined) {
          const Y = c.x1 - u / 2;
          const Z = c.x1 + Y - v;
          if (Y >= c.y0 && Y < c.y1 && Z >= c.z0 && Z < c.z1) {
            const d = c.x1 + Y + Z;
            if (d > melhor) {
              melhor = d;
              face = FACE.direita;
              wx = c.x1;
              wy = Y;
              wz = Z;
            }
          }
        }
        if (face === 0) continue;

        a.x = wx;
        a.y = wy;
        a.z = wz;
        a.face = face;
        a.sx = sx;
        a.sy = sy;
        if (face === FACE.topo) {
          a.u = wx - c.x0;
          a.v = wy - c.y0;
          a.lu = c.x1 - c.x0;
          a.lv = c.y1 - c.y0;
        } else if (face === FACE.esquerda) {
          a.u = wx - c.x0;
          a.v = wz - c.z0;
          a.lu = c.x1 - c.x0;
          a.lv = c.z1 - c.z0;
        } else {
          a.u = wy - c.y0;
          a.v = wz - c.z0;
          a.lu = c.y1 - c.y0;
          a.lv = c.z1 - c.z0;
        }
        const material = face === FACE.topo ? c.topo : face === FACE.esquerda ? c.esquerda : c.direita;
        const cor = resolver(material, a);
        if (cor === VAZIO) continue; // furo (janela)
        const emissivo = c.emissivo ? c.emissivo(a) : 0;
        this.escrever(sy * this.w + sx, cor, melhor, reg.id, face, reg.camada, wx, wy, wz, emissivo);
      }
    }
    return reg;
  }

  /**
   * Sprite 2D ancorado num ponto do mundo (base no centro-inferior).
   * Profundidade constante: serve para planta, gato, caneca — coisas pequenas.
   */
  sprite(
    desenho: readonly string[],
    x: number,
    y: number,
    z: number,
    opcoes: {
      camada?: number;
      cores: Record<string, number>;
      dx?: number;
      dy?: number;
      vies?: number;
      emissivo?: string;
      nivelEmissivo?: number;
      nome?: string;
    },
  ): CaixaRegistrada {
    const reg: CaixaRegistrada = {
      x0: x,
      y0: y,
      z0: z,
      x1: x,
      y1: y,
      z1: z,
      id: this.caixas.length,
      camada: opcoes.camada ?? 1,
      sombra: false,
      nome: opcoes.nome ?? "sprite",
    };
    this.caixas.push(reg);
    if (this.somenteCamada !== null && this.somenteCamada !== reg.camada) return reg;
    const [bx, by] = this.projetar(x, y, z);
    const altura = desenho.length;
    const largura = Math.max(...desenho.map((l) => l.length));
    const x0 = Math.round(bx - largura / 2) + (opcoes.dx ?? 0);
    const y0 = Math.round(by - altura) + (opcoes.dy ?? 0);
    const prof = x + y + z + (opcoes.vies ?? 0);
    for (let j = 0; j < altura; j++) {
      const linha = desenho[j];
      for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === "." || ch === " ") continue;
        const cor = opcoes.cores[ch];
        if (cor === undefined) throw new Error(`cor '${ch}' sem mapeamento no sprite ${reg.nome}`);
        const sx = x0 + i;
        const sy = y0 + j;
        if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) continue;
        const emissivo = opcoes.emissivo?.includes(ch) ? (opcoes.nivelEmissivo ?? 7) : 0;
        this.escrever(sy * this.w + sx, cor, prof, reg.id, FACE.sprite, reg.camada, x, y, z + (altura - j) * 0.5, emissivo);
      }
    }
    return reg;
  }

  /** Contorno de 1px onde o objeto encosta no vazio (silhueta do diorama). */
  contornarSilhueta(cor: number, camadas?: number[]): number[] {
    const marcar: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (this.cor[i] === VAZIO) continue;
        if (camadas && !camadas.includes(this.camada[i])) continue;
        const vizinhos = [
          x > 0 ? this.cor[i - 1] : VAZIO,
          x < this.w - 1 ? this.cor[i + 1] : VAZIO,
          y > 0 ? this.cor[i - this.w] : VAZIO,
          y < this.h - 1 ? this.cor[i + this.w] : VAZIO,
        ];
        if (vizinhos.includes(VAZIO)) marcar.push(i);
      }
    }
    for (const i of marcar) this.cor[i] = cor;
    return marcar;
  }
}

/** Interseção raio × caixa (método das placas). Retorna t de entrada ou Infinity. */
export function raioCaixa(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  c: CaixaRegistrada,
): number {
  let tmin = -Infinity;
  let tmax = Infinity;
  const eixos: [number, number, number, number][] = [
    [ox, dx, c.x0, c.x1],
    [oy, dy, c.y0, c.y1],
    [oz, dz, c.z0, c.z1],
  ];
  for (const [o, d, lo, hi] of eixos) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return Infinity;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return Infinity;
    }
  }
  if (tmax < 0) return Infinity;
  return tmin;
}

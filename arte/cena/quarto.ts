/**
 * O quarto em duas composições:
 *  - "larga" (320×200): desktop, diorama completo
 *  - "alta"  (180×200): mobile e rodapé — paredes altas, janela grande, menos móveis
 * Não é a mesma cena escalada: cada composição tem o próprio enquadramento.
 */
import { VAZIO } from "../../src/arte/paleta";
import { type Amostra, Tela } from "../iso";
import { CANECA, CONTROLE, CORES, FONE, GATO_DORMINDO, LUMINARIA, PLANTA_GRANDE, PUFE, SUCULENTA } from "./sprites";

const { F, S, L, A, V, R, C, B } = CORES;

export type Composicao = "larga" | "alta";

export interface Quarto {
  tela: Tela;
  composicao: Composicao;
  /** buraco da janela no plano x = 0 */
  janela: { y0: number; y1: number; z0: number; z1: number };
  /** retângulo de tela que contém o vão da janela */
  ceu: { x: number; y: number; w: number; h: number };
  /** linha do horizonte e centro da montanha, relativos ao retângulo do céu */
  horizonte: number;
  montanhaX: number;
  /** fontes de luz no mundo (z em px) */
  lampada: [number, number, number];
  telaMonitor: [number, number, number];
  /** área clicável da luminária, em pixels da cena */
  alvoLuminaria: { x: number; y: number; w: number; h: number };
  animacoes: { nome: string; camada: number; x: number; y: number }[];
  /** ids das caixas que não devem sombrear a própria luz */
  caixasLuminaria: number[];
  /** pixels do contorno da silhueta (só na montagem completa) */
  contorno: number[];
}

const piso = ({ u, v }: Amostra) => {
  // tábuas ao longo de x, 7 unidades de largura, emendas desencontradas
  const tabua = Math.floor(v / 7);
  if (Math.floor(v) % 7 === 0) return L;
  if ((Math.floor(u) + ((tabua * 37) % 29)) % 29 === 0) return L;
  return R;
};

function paredeComJanela(janela: Quarto["janela"], base: number, rodape: number) {
  const meioY = Math.floor((janela.y0 + janela.y1) / 2);
  const meioZ = Math.floor((janela.z0 + janela.z1) / 2);
  return ({ u, v }: Amostra) => {
    const dentroY = u >= janela.y0 && u < janela.y1;
    const dentroZ = v >= janela.z0 && v < janela.z1;
    if (dentroY && dentroZ) {
      // caixilho em cruz
      if (Math.floor(u) === meioY || (v >= meioZ && v < meioZ + 2)) return L;
      return VAZIO;
    }
    const molduraY = u >= janela.y0 - 1 && u < janela.y1 + 1;
    const molduraZ = v >= janela.z0 - 2 && v < janela.z1 + 2;
    if (molduraY && molduraZ) return L;
    if (v < 4) return rodape;
    return base;
  };
}

/** Varal de luzinhas perto do teto: altura do fio em cada ponto e posição das lâmpadas. */
function varal(u: number, altoParede: number): { fio: number; lampada: number | null } {
  const vao = 14;
  const fase = ((Math.floor(u) % vao) + vao) % vao;
  const fio = altoParede - 6 - Math.round(2.5 * Math.sin((Math.PI * fase) / vao));
  const cores = [CORES.A, CORES.C, CORES.R];
  const lampada = fase % 4 === 2 ? cores[Math.floor(u / 4) % 3] : null;
  return { fio, lampada };
}

function paredeFundo(
  base: number,
  rodape: number,
  quadro: { u0: number; u1: number; v0: number; v1: number },
  altoParede: number,
) {
  return ({ u, v }: Amostra) => {
    if (u > 1) {
      const { fio, lampada } = varal(u, altoParede);
      const fv = Math.floor(v);
      if (fv === fio) return S;
      if (lampada !== null && fv === fio - 1) return lampada;
    }
    if (u >= quadro.u0 && u < quadro.u1 && v >= quadro.v0 && v < quadro.v1) {
      const lu = Math.floor(u - quadro.u0);
      const lv = Math.floor(v - quadro.v0);
      const largura = quadro.u1 - quadro.u0;
      const altura = quadro.v1 - quadro.v0;
      if (lu === 0 || lu === largura - 1 || lv === 0 || lv === altura - 1) return L;
      // kanban de três colunas (colunas de 3 unidades separadas por linha)
      if (lu === 4 || lu === 8) return L;
      const coluna = lu < 4 ? 0 : lu < 8 ? 1 : 2;
      const dentroNota = (lu - 1) % 4 !== 2;
      const cores = [
        [A, V, C],
        [C, A],
        [V],
      ][coluna];
      for (let n = 0; n < cores.length; n++) {
        const topo = altura - 3 - n * 5;
        if (dentroNota && lv <= topo && lv > topo - 3) return cores[n];
      }
      return R;
    }
    if (v < 4) return rodape;
    if (Math.floor(u) % 8 === 4 && Math.floor(v) % 6 === 3) return S;
    return base;
  };
}

function conteudoMonitor(largura: number, altura: number) {
  // linhas de código: [recuo, comprimento, cor]
  const linhas: [number, number, number][] = [
    [0, 5, A],
    [1, 7, C],
    [2, 4, V],
    [2, 6, B],
    [1, 3, C],
    [0, 2, A],
  ];
  return ({ u, v }: Amostra) => {
    if (u < 1 || u >= largura - 1 || v < 1 || v >= altura - 1) return S;
    const deCima = Math.floor(altura - 2 - v);
    if (deCima % 2 === 1) {
      const linha = (deCima - 1) / 2;
      if (linha < linhas.length) {
        const [recuo, comp, cor] = linhas[linha];
        const x = Math.floor(u) - 2;
        if (x >= recuo && x < recuo + comp) return cor;
      }
    }
    return F;
  };
}

export function montarQuarto(composicao: Composicao, somenteCamada: number | null = null): Quarto {
  const larga = composicao === "larga";
  const W = larga ? 56 : 36;
  const D = larga ? 56 : 36;
  const H = larga ? 62 : 96;
  const tela = larga ? new Tela(320, 200, 160, 78) : new Tela(180, 200, 90, 110);
  tela.somenteCamada = somenteCamada;

  const janela = larga ? { y0: 18, y1: 38, z0: 24, z1: 50 } : { y0: 9, y1: 27, z0: 34, z1: 80 };

  // ——— camada 0: estrutura ———
  tela.caixa({ nome: "piso", x0: 0, y0: 0, z0: -6, x1: W, y1: D, z1: 0, topo: piso, esquerda: L, direita: S, camada: 0 });
  tela.caixa({
    nome: "parede-esquerda",
    x0: -4,
    y0: 0,
    z0: 0,
    x1: 0,
    y1: D,
    z1: H,
    topo: B,
    esquerda: S,
    direita: paredeComJanela(janela, S, F),
    camada: 0,
  });
  const quadro = larga ? { u0: 3, u1: 16, v0: 30, v1: 48 } : { u0: 2, u1: 15, v0: 44, v1: 62 };
  tela.caixa({
    nome: "parede-fundo",
    x0: 0,
    y0: -4,
    z0: 0,
    x1: W,
    y1: 0,
    z1: H,
    topo: B,
    esquerda: paredeFundo(L, S, quadro, H),
    direita: S,
    camada: 0,
    emissivo: ({ u, v, face }) => {
      if (face !== 2 || u <= 1) return 0;
      const { fio, lampada } = varal(u, H);
      return lampada !== null && Math.floor(v) === fio - 1 ? 4 : 0;
    },
  });
  tela.caixa({ nome: "quina", x0: -4, y0: -4, z0: 0, x1: 0, y1: 0, z1: H, topo: B, camada: 0 });
  tela.caixa({
    nome: "vao-lateral",
    x0: -4,
    y0: janela.y0 - 1,
    z0: janela.z0,
    x1: 0,
    y1: janela.y0,
    z1: janela.z1,
    esquerda: L,
    camada: 0,
    sombra: false,
  });
  tela.caixa({
    nome: "peitoril",
    x0: -4,
    y0: janela.y0 - 2,
    z0: janela.z0 - 3,
    x1: 3,
    y1: janela.y1 + 2,
    z1: janela.z0,
    topo: ({ u, lu }) => (u >= lu - 1 ? C : B),
    esquerda: S,
    direita: L,
    camada: 0,
  });

  const animacoes: Quarto["animacoes"] = [];
  const caixasLuminaria: number[] = [];

  // ——— camada 1: móveis ———
  const mesa = larga ? { x0: 16, x1: 46, y1: 15, z: 26 } : { x0: 6, x1: 34, y1: 13, z: 26 };
  tela.caixa({
    nome: "tampo",
    x0: mesa.x0,
    y0: 0,
    z0: mesa.z - 3,
    x1: mesa.x1,
    y1: mesa.y1,
    z1: mesa.z,
    topo: ({ u }) => (Math.floor(u) % 9 === 8 ? R : A),
    esquerda: R,
    direita: L,
    camada: 1,
  });
  tela.caixa({
    nome: "perna",
    x0: mesa.x0 + 1,
    y0: mesa.y1 - 3,
    z0: 0,
    x1: mesa.x0 + 3,
    y1: mesa.y1 - 1,
    z1: mesa.z - 3,
    esquerda: L,
    direita: S,
    camada: 1,
  });
  tela.caixa({
    nome: "gaveteiro",
    x0: mesa.x1 - 11,
    y0: 1,
    z0: 0,
    x1: mesa.x1 - 1,
    y1: mesa.y1 - 1,
    z1: mesa.z - 3,
    esquerda: ({ v, u }) => {
      const fv = Math.floor(v);
      if (fv === 7 || fv === 15) return L;
      if (Math.floor(u) === 5 && (fv === 11 || fv === 19 || fv === 3)) return A;
      return R;
    },
    direita: L,
    camada: 1,
  });

  // monitor
  const mx = larga ? 23 : 12;
  const larguraTela = larga ? 16 : 14;
  tela.caixa({ nome: "pe-monitor", x0: mx + 5, y0: 3, z0: mesa.z, x1: mx + 10, y1: 7, z1: mesa.z + 1, topo: S, esquerda: F, direita: F, camada: 1 });
  tela.caixa({ nome: "haste-monitor", x0: mx + 7, y0: 4, z0: mesa.z + 1, x1: mx + 8, y1: 5, z1: mesa.z + 6, esquerda: S, direita: F, camada: 1 });
  tela.caixa({
    nome: "monitor",
    x0: mx,
    y0: 4,
    z0: mesa.z + 5,
    x1: mx + larguraTela,
    y1: 6,
    z1: mesa.z + 19,
    topo: S,
    esquerda: conteudoMonitor(larguraTela, 14),
    direita: F,
    camada: 1,
    emissivo: ({ u, v }) => (u >= 1 && u < larguraTela - 1 && v >= 1 && v < 13 ? 7 : 0),
  });
  const telaMonitor: [number, number, number] = [mx + larguraTela / 2, 7, mesa.z + 12];

  // teclado e mouse
  tela.caixa({
    nome: "teclado",
    x0: mx + 1,
    y0: 9,
    z0: mesa.z,
    x1: mx + 14,
    y1: 13,
    z1: mesa.z + 1,
    topo: ({ u, v }) => ((Math.floor(u) + Math.floor(v)) % 2 === 0 ? B : C),
    esquerda: S,
    direita: F,
    camada: 1,
  });
  tela.caixa({ nome: "mouse", x0: mx + 17, y0: 10, z0: mesa.z, x1: mx + 19, y1: 12, z1: mesa.z + 1, topo: C, esquerda: B, direita: L, camada: 1 });

  // luminária articulada
  const lx = mesa.x0 + 3;
  const ly = 4;
  const luminaria = tela.sprite(LUMINARIA as unknown as string[], lx, ly, mesa.z, {
    cores: CORES,
    camada: 1,
    emissivo: "C",
    nivelEmissivo: 4,
    nome: "luminaria",
    vies: 3,
    dx: 2,
  });
  caixasLuminaria.push(luminaria.id);
  const lampada: [number, number, number] = [lx + 1.5, ly - 1, mesa.z + 13];
  const [lsx, lsy] = tela.projetar(lx, ly, mesa.z);
  const alvoLuminaria = { x: Math.round(lsx - 5), y: Math.round(lsy - 19), w: 14, h: 20 };

  // caneca com vapor
  const [csx, csy] = tela.projetar(mesa.x1 - 6, 5, mesa.z);
  tela.sprite(CANECA as unknown as string[], mesa.x1 - 6, 5, mesa.z, { cores: CORES, camada: 1, nome: "caneca", vies: 2 });
  animacoes.push({ nome: "vapor", camada: 1, x: Math.round(csx - 3), y: Math.round(csy - 12) });

  // prateleira com livros
  const pz = larga ? 48 : 60;
  const px0 = larga ? mesa.x0 + 2 : 16;
  const px1 = larga ? mesa.x1 - 2 : W - 1;
  tela.caixa({ nome: "prateleira", x0: px0, y0: 0, z0: pz, x1: px1, y1: 6, z1: pz + 2, topo: A, esquerda: R, direita: L, camada: 1 });
  const livros: [number, number, number][] = [
    [1, 9, R],
    [2, 8, V],
    [1, 10, B],
    [2, 7, A],
    [1, 9, S],
  ];
  let bx = px0 + 1;
  for (const [larguraLivro, altura, cor] of livros) {
    tela.caixa({
      nome: "livro",
      x0: bx,
      y0: 1,
      z0: pz + 2,
      x1: bx + larguraLivro,
      y1: 5,
      z1: pz + 2 + altura,
      topo: C,
      esquerda: ({ v }) => (Math.floor(v) === altura - 3 ? C : cor),
      direita: L,
      camada: 1,
    });
    bx += larguraLivro;
  }
  tela.sprite(CONTROLE as unknown as string[], px1 - 6, 3, pz + 2, { cores: CORES, camada: 1, nome: "controle", vies: 4 });
  if (larga) tela.sprite(SUCULENTA as unknown as string[], px1 - 15, 3, pz + 2, { cores: CORES, camada: 1, nome: "suculenta", vies: 4 });

  if (larga) tela.sprite(FONE as unknown as string[], mx + larguraTela + 1, 5, mesa.z + 16, { cores: CORES, camada: 1, nome: "fone", vies: 3 });

  // gato dormindo no peitoril
  const gatoY = Math.round((janela.y0 + janela.y1) / 2) + (larga ? 5 : 4);
  tela.sprite(GATO_DORMINDO[0] as unknown as string[], 1.5, gatoY, janela.z0, { cores: CORES, camada: 1, nome: "gato", vies: 6 });
  const [gsx, gsy] = tela.projetar(1.5, gatoY, janela.z0);
  animacoes.push({ nome: "gato", camada: 1, x: Math.round(gsx - 8), y: Math.round(gsy - 9) });

  // cadeira
  const cx = larga ? 28 : 14;
  const cy = larga ? 21 : 19;
  tela.caixa({ nome: "rodizio-x", x0: cx, y0: cy + 4, z0: 1, x1: cx + 9, y1: cy + 5, z1: 2, topo: S, esquerda: F, direita: F, camada: 1, sombra: false });
  tela.caixa({ nome: "rodizio-y", x0: cx + 4, y0: cy, z0: 1, x1: cx + 5, y1: cy + 9, z1: 2, topo: S, esquerda: F, direita: F, camada: 1, sombra: false });
  tela.caixa({ nome: "coluna", x0: cx + 4, y0: cy + 4, z0: 2, x1: cx + 5, y1: cy + 5, z1: 12, esquerda: L, direita: S, camada: 1 });
  tela.caixa({ nome: "assento", x0: cx, y0: cy, z0: 12, x1: cx + 9, y1: cy + 9, z1: 15, topo: B, esquerda: L, direita: S, camada: 1 });
  tela.caixa({
    nome: "encosto",
    x0: cx,
    y0: cy + 8,
    z0: 15,
    x1: cx + 9,
    y1: cy + 10,
    z1: 30,
    topo: C,
    esquerda: ({ u, v, lu, lv }) => (u < 1 || u >= lu - 1 || v >= lv - 2 ? B : L),
    direita: S,
    camada: 1,
  });

  // tapete
  tela.caixa({
    nome: "tapete",
    x0: larga ? 12 : 5,
    y0: larga ? 17 : 15,
    z0: 0,
    x1: larga ? 50 : 33,
    y1: larga ? 48 : 34,
    z1: 1,
    topo: ({ u, v, lu, lv }) => {
      const bu = Math.min(u, lu - u);
      const bv = Math.min(v, lv - v);
      const borda = Math.min(bu, bv);
      if (borda < 1) return L;
      if (borda < 2) return C;
      if (borda < 3) return V;
      // quadrados no mundo viram losangos na tela
      const pu = ((((u - lu / 2) % 8) + 8) % 8) - 4;
      const pv = ((((v - lv / 2) % 8) + 8) % 8) - 4;
      const d = Math.max(Math.abs(pu), Math.abs(pv));
      if (d >= 1.5 && d < 2.5) return A;
      return V;
    },
    esquerda: L,
    direita: F,
    camada: 1,
    sombra: false,
  });

  // ——— camada 2: frente ———
  const vaso = larga ? { x: 4, y: 45 } : { x: 3, y: 28 };
  tela.caixa({
    nome: "vaso",
    x0: vaso.x,
    y0: vaso.y,
    z0: 0,
    x1: vaso.x + 7,
    y1: vaso.y + 7,
    z1: 10,
    topo: ({ u, v, lu, lv }) => (u < 1 || u >= lu - 1 || v < 1 || v >= lv - 1 ? R : S),
    esquerda: ({ v }) => (Math.floor(v) >= 8 ? A : R),
    direita: ({ v }) => (Math.floor(v) >= 8 ? R : L),
    camada: 2,
  });
  tela.sprite(PLANTA_GRANDE as unknown as string[], vaso.x + 3.5, vaso.y + 3.5, 10, { cores: CORES, camada: 2, nome: "planta", vies: 8, dy: 2 });
  if (larga) tela.sprite(PUFE as unknown as string[], 8, 30, 0, { cores: CORES, camada: 2, nome: "pufe", vies: 6 });

  const contorno = somenteCamada === null ? tela.contornarSilhueta(F) : [];

  // retângulo do céu = caixa envolvente do vão
  const cantos = [
    tela.projetar(0, janela.y0, janela.z0),
    tela.projetar(0, janela.y1, janela.z0),
    tela.projetar(0, janela.y0, janela.z1),
    tela.projetar(0, janela.y1, janela.z1),
  ];
  const x = Math.floor(Math.min(...cantos.map((p) => p[0])));
  const y = Math.floor(Math.min(...cantos.map((p) => p[1])));
  const ceu = {
    x,
    y,
    w: Math.ceil(Math.max(...cantos.map((p) => p[0]))) - x,
    h: Math.ceil(Math.max(...cantos.map((p) => p[1]))) - y,
  };
  // horizonte a 30% da borda inferior (lado mais baixo do vão), montanha centrada ali
  const [bxEsq, byEsq] = tela.projetar(0, janela.y1, janela.z0);
  const [bxDir, byDir] = tela.projetar(0, janela.y0, janela.z0);
  const hx = bxEsq + (bxDir - bxEsq) * 0.3;
  const hy = byEsq + (byDir - byEsq) * 0.3;
  // o peitoril cobre a parte de baixo do vão; o horizonte fica acima dele
  const horizonte = Math.round(hy - y) - (larga ? 7 : 12);
  const montanhaX = Math.round(hx - x) + 4;

  return {
    tela,
    composicao,
    janela,
    ceu,
    horizonte,
    montanhaX,
    lampada,
    telaMonitor,
    alvoLuminaria,
    animacoes,
    caixasLuminaria,
    contorno,
  };
}

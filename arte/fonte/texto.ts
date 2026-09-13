/**
 * Glifos prontos (com acentos compostos) e desenho de texto em buffer de índices.
 * Usado pelo gerador da fonte e pela OG image.
 */
import { ACENTOS, COMPOSTOS, G, LARGURA_ESPACO, MANUAIS, RESPIRO } from "./glifos";

export const LINHAS_EM = 12;

export interface Glifo {
  largura: number;
  /** 12 linhas alinhadas à grade do em */
  linhas: string[];
}

function normalizar(corpo: readonly string[], largura: number, acima: readonly string[] = ["", ""]): string[] {
  const linhas: string[] = [];
  const pad = (s: string) => (s + ".".repeat(largura)).slice(0, largura);
  linhas.push(pad(acima[0] ?? ""), pad(acima[1] ?? ""));
  for (let i = 0; i < LINHAS_EM - 2; i++) linhas.push(pad(corpo[i] ?? ""));
  return linhas;
}

function largura(desenho: readonly string[]): number {
  return Math.max(...desenho.map((l) => l.length));
}

function comAcento(base: Glifo, acento: readonly string[], minuscula: boolean): Glifo {
  const la = largura(acento);
  const offset = Math.round((base.largura - la) / 2);
  const linhas = base.linhas.map((l) => l.split(""));
  // maiúscula: linhas 0–1; minúscula: linhas 1–2 (logo acima da altura-x, com uma linha de folga)
  const inicio = minuscula ? 1 : 0;
  acento.forEach((linha, j) => {
    for (let i = 0; i < linha.length; i++) {
      if (linha[i] !== "#") continue;
      const x = offset + i;
      if (x >= 0 && x < base.largura) linhas[inicio + j][x] = "#";
    }
  });
  return { largura: base.largura, linhas: linhas.map((l) => l.join("")) };
}

let cache: Map<string, Glifo> | null = null;

export function glifos(): Map<string, Glifo> {
  if (cache) return cache;
  const mapa = new Map<string, Glifo>();
  for (const [ch, desenho] of Object.entries(G)) {
    const w = largura(desenho);
    mapa.set(ch, { largura: w, linhas: normalizar(desenho, w) });
  }
  for (const [ch, base, acento] of COMPOSTOS) {
    const g = mapa.get(base);
    if (!g) throw new Error(`base ${base} ausente`);
    const minuscula = base === base.toLowerCase();
    mapa.set(ch, comAcento(g, ACENTOS[acento], minuscula));
  }
  for (const [ch, { acima, corpo }] of Object.entries(MANUAIS)) {
    const w = Math.max(largura(corpo), largura(acima));
    mapa.set(ch, { largura: w, linhas: normalizar(corpo, w, acima) });
  }
  // aspas tipográficas reaproveitam as retas
  const aspasSimples = mapa.get("'");
  const aspasDuplas = mapa.get('"');
  if (aspasSimples) {
    mapa.set("‘", aspasSimples);
    mapa.set("’", aspasSimples);
  }
  if (aspasDuplas) {
    mapa.set("“", aspasDuplas);
    mapa.set("”", aspasDuplas);
  }
  mapa.set(" ", { largura: LARGURA_ESPACO - RESPIRO, linhas: normalizar([], LARGURA_ESPACO - RESPIRO) });
  cache = mapa;
  return mapa;
}

export function medirTexto(texto: string): number {
  const mapa = glifos();
  let w = 0;
  for (const ch of texto) {
    const g = mapa.get(ch) ?? mapa.get("?")!;
    w += g.largura + RESPIRO;
  }
  return Math.max(0, w - RESPIRO);
}

/** Desenha texto num buffer de índices; (x, y) = canto superior esquerdo do em. */
export function desenharTexto(
  buf: Uint8Array,
  larguraBuf: number,
  alturaBuf: number,
  texto: string,
  x: number,
  y: number,
  cor: number,
  escala = 1,
): void {
  const mapa = glifos();
  let cx = x;
  for (const ch of texto) {
    const g = mapa.get(ch) ?? mapa.get("?")!;
    g.linhas.forEach((linha, j) => {
      for (let i = 0; i < linha.length; i++) {
        if (linha[i] !== "#") continue;
        for (let dy = 0; dy < escala; dy++)
          for (let dx = 0; dx < escala; dx++) {
            const px = cx + i * escala + dx;
            const py = y + j * escala + dy;
            if (px >= 0 && py >= 0 && px < larguraBuf && py < alturaBuf) buf[py * larguraBuf + px] = cor;
          }
      }
    });
    cx += (g.largura + RESPIRO) * escala;
  }
}

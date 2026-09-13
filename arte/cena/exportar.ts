/**
 * Monta as camadas da cena (base + mapas de luz) para uma composição.
 */
import { INDICE, VAZIO } from "../../src/arte/paleta";
import type { CamadaCena } from "../../src/arte/compositor";
import { DIRECOES_SOL, mapaLuminaria, mapaSol } from "./luz";
import { type Composicao, montarQuarto, type Quarto } from "./quarto";

export const NUM_CAMADAS = 3;

export type MetaCena = Pick<Quarto, "composicao" | "janela" | "ceu" | "horizonte" | "montanhaX" | "alvoLuminaria" | "animacoes">;

export interface CenaExportada {
  largura: number;
  altura: number;
  camadas: CamadaCena[];
  meta: MetaCena;
}

export function exportarCena(composicao: Composicao): CenaExportada {
  const completo = montarQuarto(composicao);
  const { tela, janela } = completo;
  const camadas: CamadaCena[] = [];
  for (let c = 0; c < NUM_CAMADAS; c++) {
    const q = montarQuarto(composicao, c);
    const base = new Uint8Array(q.tela.cor);
    for (const p of completo.contorno) {
      if (tela.camada[p] === c && base[p] !== VAZIO) base[p] = INDICE.fundo;
    }
    let mascaraJanela: Uint8Array | undefined;
    if (c === 0) {
      mascaraJanela = new Uint8Array(base.length);
      for (let sy = 0; sy < tela.h; sy++)
        for (let sx = 0; sx < tela.w; sx++) {
          const p = sy * tela.w + sx;
          if (base[p] !== VAZIO) continue;
          // ponto no plano x = 0 que cai neste pixel
          const Y = -(sx - tela.ox + 0.5) / 2;
          const Z = Y - (sy - tela.oy + 0.5);
          if (Y >= janela.y0 && Y < janela.y1 && Z >= janela.z0 && Z < janela.z1) mascaraJanela[p] = 1;
        }
    }
    camadas.push({
      largura: q.tela.w,
      altura: q.tela.h,
      base,
      sol: DIRECOES_SOL.map((d) => mapaSol(q, d)),
      luz: mapaLuminaria(q),
      emissivo: new Uint8Array(q.tela.emissivo),
      janela: mascaraJanela,
    });
  }
  const { ceu, horizonte, montanhaX, alvoLuminaria, animacoes } = completo;
  return {
    largura: tela.w,
    altura: tela.h,
    camadas,
    meta: { composicao, janela, ceu, horizonte, montanhaX, alvoLuminaria, animacoes },
  };
}

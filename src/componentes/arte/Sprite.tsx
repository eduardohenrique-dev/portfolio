"use client";
/**
 * Sprite pequeno em canvas, recolorido pela paleta do horário atual.
 * O tamanho é reservado no CSS antes do JS (sem layout shift).
 */
import { useEffect, useRef } from "react";
import { ATLAS } from "@/arte/atlas.gerado";
import { carregarFolhas, type NomeRegiao, recortar, RGBA } from "@/arte/folha";
import { assinar } from "@/arte/horario";
import { BAYER4 } from "@/arte/paleta";

interface Props {
  regiao: NomeRegiao;
  /** múltiplo inteiro de pixels CSS por pixel do sprite */
  escala: number;
  rotulo?: string;
  espelhar?: boolean;
  className?: string;
}

export function Sprite({ regiao, escala, rotulo, espelhar = false, className }: Props) {
  const tela = useRef<HTMLCanvasElement>(null);
  const [, , w, h] = ATLAS.regioes[regiao];

  useEffect(() => {
    const el = tela.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    let vivo = true;
    let cancelar = () => {};
    carregarFolhas()
      .then((folhas) => {
        if (!vivo) return;
        const dados = recortar(folhas.sprites, ATLAS.regioes[regiao]);
        const imagem = ctx.createImageData(w, h);
        const vista = new Uint32Array(imagem.data.buffer);
        cancelar = assinar((estado) => {
          const nova = RGBA[estado.indice];
          const antiga = RGBA[estado.anterior];
          const t = estado.transicao;
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const p = y * w + x;
              const tabela = t >= 1 || (BAYER4[y & 3][x & 3] + 0.5) / 16 < t ? nova : antiga;
              vista[p] = tabela[dados[p]];
            }
          ctx.putImageData(imagem, 0, 0);
        });
      })
      .catch(() => {});
    return () => {
      vivo = false;
      cancelar();
    };
  }, [regiao, w, h]);

  return (
    <canvas
      ref={tela}
      width={w}
      height={h}
      className={`sprite ${className ?? ""}`}
      style={{ width: w * escala, height: h * escala, transform: espelhar ? "scaleX(-1)" : undefined }}
      {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true })}
    />
  );
}

"use client";
/**
 * HUD fixo: o relógio da página (a hora avança com a rolagem) e o mapa das seções.
 */
import { useEffect, useRef, useState } from "react";
import { assinar, formatarHora, MINUTO_INICIAL } from "@/arte/horario";
import { Sprite } from "./arte/Sprite";

interface Props {
  secoes: { id: string; rotulo: string }[];
}

const ICONES = ["hud-sol", "hud-por-do-sol", "hud-lua", "hud-lua"] as const;

export function Hud({ secoes }: Props) {
  const [minutos, setMinutos] = useState(MINUTO_INICIAL);
  const [indice, setIndice] = useState(0);
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  useEffect(
    () =>
      assinar((e) => {
        setMinutos(e.minutos);
        setIndice(e.indice);
      }),
    [],
  );

  useEffect(() => {
    if (!aberto) return;
    const fechar = (ev: MouseEvent | KeyboardEvent) => {
      if (ev instanceof KeyboardEvent) {
        if (ev.key !== "Escape") return;
        setAberto(false);
        botao.current?.focus();
        return;
      }
      if (!raiz.current?.contains(ev.target as Node)) setAberto(false);
    };
    document.addEventListener("keydown", fechar);
    document.addEventListener("pointerdown", fechar);
    return () => {
      document.removeEventListener("keydown", fechar);
      document.removeEventListener("pointerdown", fechar);
    };
  }, [aberto]);

  return (
    <header ref={raiz} className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
      <div className="moldura flex items-center gap-4 bg-fundo px-3 py-1">
        <div className="flex items-center gap-2" aria-hidden="true" title="A hora avança conforme você rola a página">
          <Sprite regiao={ICONES[indice]} escala={2} />
          <span className="pixel text-pixel-2 tabular-nums">{formatarHora(minutos)}</span>
        </div>
        <nav aria-label="Seções da página">
          <button
            ref={botao}
            type="button"
            className="pixel text-pixel-2 text-ambar"
            aria-expanded={aberto}
            aria-controls="mapa-secoes"
            onClick={() => setAberto((a) => !a)}
          >
            mapa
          </button>
          <ul id="mapa-secoes" hidden={!aberto} className="moldura absolute top-16 right-0 flex w-60 flex-col bg-fundo py-2">
            {secoes.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="pixel block px-4 py-1 text-pixel-2 hover:bg-superficie hover:text-ambar"
                  onClick={() => setAberto(false)}
                >
                  {s.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

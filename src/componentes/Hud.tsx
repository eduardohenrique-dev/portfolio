"use client";
/**
 * HUD fixo: o relógio da página (a hora avança com a rolagem) e o mapa das seções.
 * Fica no mesmo respiro lateral das seções (20px no celular, 40px a partir do tablet),
 * e o mapa marca a seção em que o visitante está.
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
  const [atual, setAtual] = useState(secoes[0]?.id);
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

  // a seção atual é a que cruza a linha a 40% da altura da tela
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtual(e.target.id);
      },
      { rootMargin: "-40% 0px -60% 0px" },
    );
    for (const s of secoes) {
      const el = document.getElementById(s.id);
      if (el) observador.observe(el);
    }
    return () => observador.disconnect();
  }, [secoes]);

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
    <header ref={raiz} className="fixed top-5 right-5 z-50 md:top-10 md:right-10">
      <div className="moldura flex items-center gap-4 bg-fundo px-3 py-1">
        <div className="flex items-center gap-2" aria-hidden="true" title="A hora avança conforme você rola a página">
          <Sprite regiao={ICONES[indice]} escala={2} />
          <span className="pixel text-pixel-2 tabular-nums">{formatarHora(minutos)}</span>
        </div>
        <nav aria-label="Seções da página">
          {/* a área de toque vai até a borda do HUD: 40px de altura, não só a da palavra */}
          <button
            ref={botao}
            type="button"
            className="pixel -my-1 -mr-3 -ml-2 py-1 pr-3 pl-2 text-pixel-2 text-ambar hover:text-creme"
            aria-expanded={aberto}
            aria-controls="mapa-secoes"
            onClick={() => setAberto((a) => !a)}
          >
            mapa
          </button>
          <ul id="mapa-secoes" hidden={!aberto} className="moldura absolute top-16 right-0 flex w-60 flex-col bg-fundo py-2">
            {secoes.map((s) => {
              const aqui = s.id === atual;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={aqui ? "location" : undefined}
                    className={`pixel flex items-center gap-3 px-4 py-1 text-pixel-2 hover:bg-superficie hover:text-ambar ${aqui ? "text-ambar" : ""}`}
                    onClick={() => setAberto(false)}
                  >
                    <span className={`size-2 shrink-0 ${aqui ? "bg-ambar" : ""}`} aria-hidden="true" />
                    {s.rotulo}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

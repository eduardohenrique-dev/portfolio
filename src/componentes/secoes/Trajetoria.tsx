"use client";
/**
 * Linha do tempo percorrida na horizontal. A seção fica presa, a trilha anda e o personagem
 * caminha em quadros conforme a distância percorrida; parou de rolar, ele para.
 * No celular e com menos movimento vira uma lista vertical comum.
 */
import { useRef } from "react";
import type { Marco } from "@/conteudo/trajetoria";
import { Sprite } from "@/componentes/arte/Sprite";
import { gsap, Observer, useGSAP } from "@/componentes/movimento/gsap";

interface Props {
  marcos: Marco[];
  agora: string;
  titulo: string;
  texto: string;
}

const PASSO_PX = 20;

export function Trajetoria({ marcos, agora, titulo, texto }: Props) {
  const secao = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const andarilho = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = trilho.current;
        const boneco = andarilho.current;
        if (!el || !boneco) return;
        const distancia = () => Math.max(0, el.scrollWidth - window.innerWidth);
        const mostrarQuadro = (q: number) => {
          boneco.dataset.quadro = String(q);
        };

        gsap.to(el, {
          x: () => -distancia(),
          ease: "none",
          // posição sempre em múltiplos de 4px: texto pixel não borra no meio do caminho
          modifiers: { x: gsap.utils.unitize((x: number) => Math.round(x / 4) * 4) },
          scrollTrigger: {
            trigger: secao.current,
            start: "top top",
            end: () => `+=${distancia()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const andado = self.progress * distancia();
              mostrarQuadro(1 + (Math.floor(andado / PASSO_PX) % 4));
            },
          },
        });

        const observador = Observer.create({
          target: window,
          type: "wheel,touch,scroll",
          onDown: () => boneco.classList.remove("voltando"),
          onUp: () => boneco.classList.add("voltando"),
          onStop: () => mostrarQuadro(0),
          onStopDelay: 0.16,
        });
        return () => observador.kill();
      });
    },
    { scope: secao },
  );

  return (
    <section ref={secao} id="trajetoria" aria-labelledby="titulo-trajetoria" className="trajetoria relative overflow-hidden py-20 md:py-24 lg:flex lg:h-dvh lg:flex-col lg:justify-center lg:py-0">
      <div className="mx-auto w-full max-w-pagina px-5 md:px-10">
        <h2 id="titulo-trajetoria" className="pixel text-pixel-2 text-creme md:text-pixel-3">
          {titulo}
        </h2>
        <p className="mt-4 max-w-texto text-bruma">{texto}</p>
      </div>

      <div className="relative mt-14 lg:mt-16">
        <div ref={trilho} className="trilho px-5 md:px-10 lg:w-max lg:pr-[40vw] lg:pl-[28vw]">
          <ol className="flex flex-col gap-10 border-l-4 border-linha pl-8 lg:flex-row lg:gap-20 lg:border-l-0 lg:pl-0">
            {marcos.map((m) => (
              <li key={m.id} className="marco relative lg:w-80">
                <div className="flex items-end gap-4">
                  <Sprite regiao="marco" escala={3} className="hidden lg:block" />
                  <time dateTime={m.data} className="pixel text-pixel-2 text-salvia">
                    {m.quando}
                  </time>
                </div>
                <h3 className="pixel mt-3 text-pixel-2 text-creme">{m.titulo}</h3>
                <p className="mt-2 text-bruma">{m.texto}</p>
              </li>
            ))}
            <li className="marco relative lg:w-80">
              <p className="pixel text-pixel-2 text-ambar">agora</p>
              <p className="mt-3 text-creme">{agora}</p>
            </li>
          </ol>
          <div className="caminho mt-10 hidden lg:block" aria-hidden="true" />
        </div>

        <div ref={andarilho} className="andarilho pointer-events-none absolute bottom-4 left-[18vw] hidden lg:block" data-quadro="0" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((q) => (
            <Sprite key={q} regiao={`andarilho-${q}` as "andarilho-0"} escala={4} className="quadro" />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";
/**
 * O nome entra letra por letra, em passos — cada letra é "carimbada" de cima para baixo,
 * não desliza nem esmaece.
 */
import { useRef } from "react";
import { gsap, prefereMenosMovimento, SplitText, useGSAP } from "@/componentes/movimento/gsap";

export function TituloAbertura({ texto }: { texto: string }) {
  const titulo = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = titulo.current;
      if (!el) return;
      if (prefereMenosMovimento()) {
        gsap.set(el, { visibility: "visible" });
        return;
      }
      SplitText.create(el, {
        type: "chars",
        charsClass: "letra",
        aria: "auto",
        onSplit(self) {
          gsap.set(el, { visibility: "visible" });
          // 2 passos de 4px: nenhum quadro cai em posição fracionária
          return gsap.from(self.chars, {
            clipPath: "inset(0 0 100% 0)",
            y: -8,
            duration: 0.16,
            ease: "steps(2)",
            stagger: { each: 0.045 },
            delay: 0.15,
          });
        },
      });
    },
    { scope: titulo },
  );

  return (
    <h1 ref={titulo} id="titulo-inicio" data-titulo className="pixel text-pixel-3 text-creme md:text-pixel-4">
      {texto}
    </h1>
  );
}

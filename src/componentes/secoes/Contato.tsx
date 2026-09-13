"use client";
/**
 * Contato: o mesmo quarto, agora de noite, e um cartão-postal.
 * O verso (com o e-mail) fica visível por padrão; virar mostra a frente ilustrada.
 */
import { useRef, useState } from "react";
import { Cena } from "@/componentes/arte/Cena";
import { Sprite } from "@/componentes/arte/Sprite";
import { gsap, prefereMenosMovimento } from "@/componentes/movimento/gsap";

interface Props {
  titulo: string;
  texto: string;
  email: string;
  github: string;
  linkedin: string;
}

export function Contato({ titulo, texto, email, github, linkedin }: Props) {
  const [frente, setFrente] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const cartao = useRef<HTMLDivElement>(null);

  function virar() {
    const el = cartao.current;
    if (!el || prefereMenosMovimento()) {
      setFrente((f) => !f);
      return;
    }
    // vira "achatando" em passos, como carta de jogo: 1 → 0, troca o lado, 0 → 1
    gsap
      .timeline()
      .to(el, { scaleX: 0, duration: 0.16, ease: "steps(3)" })
      .add(() => setFrente((f) => !f))
      .to(el, { scaleX: 1, duration: 0.16, ease: "steps(3)" });
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <section id="contato" aria-labelledby="titulo-contato" className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Cena
            composicao="alta"
            horarioParado={3}
            rotulo="O mesmo quarto em pixel art, agora de noite: a luminária acesa ilumina a mesa, as luzinhas do varal brilham, o gato dorme e há estrelas sobre o Pico da Ibituruna."
          />
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-8 lg:order-2 lg:col-span-7">
          <div>
            <h2 id="titulo-contato" className="pixel text-pixel-2 text-creme md:text-pixel-3">
              {titulo}
            </h2>
            <p className="mt-4 max-w-texto text-destaque text-creme">{texto}</p>
          </div>

          <div ref={cartao} className="postal-cartao self-start">
            {frente ? (
              <figure className="moldura bg-creme p-3" style={{ ["--cor-moldura" as string]: "var(--color-creme)" }}>
                <Sprite
                  regiao="postal"
                  escala={2}
                  className="md:hidden"
                  rotulo="Cartão-postal: o Pico da Ibituruna no fim de tarde, com o Rio Doce embaixo e um parapente no céu."
                />
                <Sprite
                  regiao="postal"
                  escala={3}
                  className="hidden md:block"
                  rotulo="Cartão-postal: o Pico da Ibituruna no fim de tarde, com o Rio Doce embaixo e um parapente no céu."
                />
                <figcaption className="pixel mt-3 text-pixel-2 text-fundo">Governador Valadares, MG</figcaption>
              </figure>
            ) : (
              <div
                className="moldura postal-verso grid gap-6 bg-creme p-6 text-fundo md:grid-cols-[1fr_auto]"
                style={{ ["--cor-moldura" as string]: "var(--color-creme)" }}
              >
                <div className="flex flex-col gap-4 md:border-r-4 md:border-dashed md:border-bruma md:pr-6">
                  <p className="pixel text-pixel-2">Para</p>
                  <p className="pixel text-pixel-2 break-all md:text-pixel-3">{email}</p>
                  <p className="text-fundo">Resposta em até 1 dia útil.</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <Sprite regiao="selo" escala={3} />
                  <p className="pixel text-right text-pixel-1 text-superficie">
                    GOV. VALADARES
                    <br />
                    2026
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <a className="botao" href={`mailto:${email}`}>
              Escrever e-mail
            </a>
            <button type="button" className="botao botao-contorno" onClick={copiar} aria-live="polite">
              {copiado ? "Copiado" : "Copiar endereço"}
            </button>
            <button type="button" className="botao botao-contorno" onClick={virar} aria-pressed={frente}>
              Virar o cartão
            </button>
          </div>

          <p className="text-bruma">
            Também estou no{" "}
            <a className="link" href={github} target="_blank" rel="noreferrer">
              GitHub
            </a>{" "}
            e no{" "}
            <a className="link" href={linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

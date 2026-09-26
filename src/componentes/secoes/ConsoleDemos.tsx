"use client";
/**
 * Console das demos: o cartucho escolhido voa até o console (GSAP Flip), desce na fenda em passos,
 * a luz acende e a TV liga como tubo — uma linha que abre até a tela cheia. A tela é uma captura real
 * da demo reduzida a pixel art de 8 cores (arte/telas), então troca de cor com o horário.
 * Trocar de cartucho ejeta o anterior. Com menos movimento, tudo acontece sem animação.
 */
import { useRef, useState, useSyncExternalStore } from "react";
import { ATLAS } from "@/arte/atlas.gerado";
import type { NomeRegiao } from "@/arte/folha";
import { Sprite } from "@/componentes/arte/Sprite";
import { Flip, gsap, prefereMenosMovimento, useGSAP } from "@/componentes/movimento/gsap";
import type { Projeto } from "@/conteudo/projetos";

interface Props {
  demos: Projeto[];
  titulo: string;
  texto: string;
}

const MD = "(min-width: 768px)";
const [, , TV_W, TV_H] = ATLAS.regioes.televisao;
const [, , CONSOLE_W, CONSOLE_H] = ATLAS.regioes["console-aceso"];
const [, , CART_W, CART_H] = ATLAS.regioes["cartucho-scrims"];
const { tela: TELA, fenda: FENDA } = ATLAS.console;
/** Onde a fenda corta o cartucho, a partir do topo do console, e quanto ele afunda depois de encaixar. */
const BOCA = 5;
const AFUNDA = 10;

function assinarTela(aviso: () => void) {
  const m = window.matchMedia(MD);
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
}

/** Escala inteira: 3 a partir do tablet, 2 no celular (a TV cabe em 296px). */
function useEscala() {
  return useSyncExternalStore(
    assinarTela,
    () => (window.matchMedia(MD).matches ? 3 : 2),
    () => 3,
  );
}

function Cartucho({ demo, escala }: { demo: Projeto; escala: number }) {
  return (
    <span data-flip-id={`cartucho-${demo.id}`} className="block">
      <Sprite regiao={`cartucho-${demo.id}` as NomeRegiao} escala={escala} />
    </span>
  );
}

export function ConsoleDemos({ demos, titulo, texto }: Props) {
  const e = useEscala();
  const [inserido, setInserido] = useState<Projeto["id"] | null>(null);
  const [ligado, setLigado] = useState(false);
  const raiz = useRef<HTMLElement>(null);
  const fenda = useRef<HTMLDivElement>(null);
  const estadoFlip = useRef<Flip.FlipState | null>(null);
  const focarDepois = useRef<string | null>(null);
  const demo = demos.find((d) => d.id === inserido) ?? null;

  function trocar(id: Projeto["id"] | null) {
    if (!raiz.current) return;
    estadoFlip.current = Flip.getState(raiz.current.querySelectorAll("[data-flip-id]"));
    focarDepois.current = id ? "titulo-demo" : `cartucho-botao-${inserido}`;
    setLigado(false);
    setInserido(id);
  }

  // cartucho voando, encaixando e ligando a TV
  useGSAP(
    () => {
      const estado = estadoFlip.current;
      if (!estado || !raiz.current) return;
      estadoFlip.current = null;
      // tirar: o foco volta ao cartucho na fileira; colocar: espera a TV ligar (o título só existe depois)
      if (!inserido && focarDepois.current) {
        document.getElementById(focarDepois.current)?.focus({ preventScroll: true });
        focarDepois.current = null;
      }
      const alvo = raiz.current.querySelector<HTMLElement>(".console-fenda [data-flip-id]");
      if (prefereMenosMovimento()) {
        if (alvo) gsap.set(alvo, { y: AFUNDA * e });
        if (inserido) setLigado(true);
        return;
      }
      const tl = gsap.timeline();
      // durante o voo a fenda não corta nada; o corte volta quando o cartucho chega em cima dela
      if (fenda.current) fenda.current.style.overflow = "visible";
      tl.add(
        Flip.from(estado, {
          targets: raiz.current.querySelectorAll("[data-flip-id]"),
          duration: 0.4,
          ease: "steps(6)",
          absolute: true,
          scale: false,
        }),
      );
      tl.call(() => {
        if (fenda.current) fenda.current.style.overflow = "";
      });
      if (alvo && inserido) {
        tl.to(alvo, { y: AFUNDA * e, duration: 0.24, ease: "steps(4)" });
        tl.call(() => setLigado(true));
      }
    },
    { scope: raiz, dependencies: [inserido] },
  );

  // a TV liga: uma linha no meio que abre até a tela inteira, e o texto entra depois
  useGSAP(
    () => {
      if (!ligado) return;
      if (focarDepois.current) {
        document.getElementById(focarDepois.current)?.focus({ preventScroll: true });
        focarDepois.current = null;
      }
      if (prefereMenosMovimento()) return;
      gsap
        .timeline()
        .fromTo(".console-imagem", { clipPath: "inset(49% 0 49% 0)" }, { clipPath: "inset(0% 0 0% 0)", duration: 0.3, ease: "steps(5)", clearProps: "clipPath" })
        .from("[data-revelar-demo]", { clipPath: "inset(0 100% 0 0)", duration: 0.24, ease: "steps(4)", stagger: 0.06, clearProps: "clipPath" }, "-=0.1");
    },
    { scope: raiz, dependencies: [ligado] },
  );

  return (
    <section ref={raiz} id="demos" aria-labelledby="titulo-demos" className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24">
      <h2 id="titulo-demos" className="pixel text-pixel-2 text-creme md:text-pixel-3">
        {titulo}
      </h2>
      <p className="mt-4 max-w-texto text-bruma">{texto}</p>

      <div className="mt-14 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col items-center lg:col-span-7">
          {/* TV */}
          <div className="relative" style={{ width: TV_W * e, height: TV_H * e }}>
            <Sprite regiao="televisao" escala={e} />
            <div className="absolute" style={{ left: TELA.x * e, top: TELA.y * e, width: TELA.largura * e, height: TELA.altura * e }}>
              {ligado && demo && (
                <div className="console-imagem">
                  <Sprite regiao={`tela-${demo.id}` as NomeRegiao} escala={e} rotulo={`Tela da demo do ${demo.nome}`} />
                </div>
              )}
            </div>
          </div>

          {/* console, com espaço acima para o cartucho encaixado */}
          <div className="relative" style={{ width: CONSOLE_W * e, height: CONSOLE_H * e, marginTop: (CART_H - BOCA + 4) * e }}>
            <Sprite regiao={ligado ? "console-aceso" : "console-apagado"} escala={e} rotulo={ligado ? "Console ligado" : "Console desligado"} />
            <div
              ref={fenda}
              className="console-fenda"
              style={{ left: (FENDA.x + FENDA.largura / 2 - CART_W / 2) * e, top: (BOCA - CART_H) * e, width: CART_W * e, height: CART_H * e }}
            >
              {demo && (
                <button
                  type="button"
                  className="block"
                  aria-label={`Tirar o cartucho do ${demo.nome}`}
                  data-cursor-acao="tirar"
                  data-cursor-objeto={demo.nome}
                  onClick={() => trocar(null)}
                >
                  <Cartucho demo={demo} escala={e} />
                </button>
              )}
            </div>
          </div>

          {/* cartuchos */}
          <ul className="mt-10 flex items-end gap-6" aria-label="Cartuchos">
            {demos.map((d) => (
              <li key={d.id} style={{ width: CART_W * e, height: CART_H * e }}>
                {inserido === d.id ? (
                  <span className="vaga block h-full w-full" aria-hidden="true" />
                ) : (
                  <button
                    id={`cartucho-botao-${d.id}`}
                    type="button"
                    className="objeto block"
                    aria-label={`Colocar o cartucho do ${d.nome}`}
                    data-cursor-acao="colocar"
                    data-cursor-objeto={d.nome}
                    onClick={() => trocar(d.id)}
                  >
                    <Cartucho demo={d} escala={e} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="moldura px-6 py-6 lg:col-span-5" aria-live="polite">
          {ligado && demo ? (
            <div className="flex flex-col gap-4">
              <h3 id="titulo-demo" tabIndex={-1} className="pixel text-pixel-2 text-creme" data-revelar-demo>
                {demo.nome}
              </h3>
              <p className="text-creme" data-revelar-demo>
                {demo.resumo}
              </p>
              {demo.acesso && (
                <p className="text-miudo text-bruma" data-revelar-demo>
                  {demo.acesso}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-6" data-revelar-demo>
                <a className="botao" href={demo.url} target="_blank" rel="noreferrer">
                  Abrir a demo
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
                <button type="button" className="botao botao-contorno" onClick={() => trocar(null)}>
                  Tirar o cartucho
                </button>
              </div>
            </div>
          ) : (
            <p id="titulo-demo" tabIndex={-1} className="pixel text-pixel-2 text-bruma">
              {inserido ? "Ligando…" : "Escolha um cartucho."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

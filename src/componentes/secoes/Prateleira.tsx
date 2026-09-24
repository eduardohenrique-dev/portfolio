"use client";
/**
 * Projetos como objetos numa prateleira. Abrir um objeto usa GSAP Flip:
 * a moldura do objeto é a mesma moldura do painel — ela cresce até virar o painel.
 */
import { useRef, useState } from "react";
import type { Projeto } from "@/conteudo/projetos";
import { Sprite } from "@/componentes/arte/Sprite";
import type { NomeRegiao } from "@/arte/folha";
import { Flip, gsap, prefereMenosMovimento, useGSAP } from "@/componentes/movimento/gsap";

interface Props {
  projetos: Projeto[];
  titulo: string;
  texto: string;
}

const TAMANHO = { cartucho: [30, 36], fichario: [26, 42], caderno: [30, 40] } as const;
const ESCALA = 4;
const ENFEITES: Record<number, NomeRegiao[]> = { 0: ["suculenta"], 1: ["controle", "caneca"] };

function Tabua({ rotulo }: { rotulo?: string }) {
  return (
    <>
      <span className="tabua block w-full" aria-hidden="true" />
      <span className="pixel mt-3 block min-h-8 text-center text-pixel-1 text-bruma md:text-pixel-2" aria-hidden="true">
        {rotulo}
      </span>
    </>
  );
}

export function Prateleira({ projetos, titulo, texto }: Props) {
  const [aberto, setAberto] = useState<Projeto["id"] | null>(null);
  const raiz = useRef<HTMLElement>(null);
  const estadoFlip = useRef<Flip.FlipState | null>(null);
  const focarDepois = useRef<string | null>(null);

  function trocar(id: Projeto["id"] | null) {
    if (!raiz.current) return;
    estadoFlip.current = Flip.getState(raiz.current.querySelectorAll("[data-flip-id]"));
    focarDepois.current = id ? "titulo-projeto" : `objeto-${aberto}`;
    setAberto(id);
  }

  useGSAP(
    () => {
      const estado = estadoFlip.current;
      if (!estado || !raiz.current) return;
      estadoFlip.current = null;
      // o foco vai já para o destino (sem rolar a página): leitor de tela não fica sem contexto durante o Flip
      if (focarDepois.current) document.getElementById(focarDepois.current)?.focus({ preventScroll: true });
      focarDepois.current = null;
      if (prefereMenosMovimento()) return;
      Flip.from(estado, {
        targets: raiz.current.querySelectorAll("[data-flip-id]"),
        duration: 0.48,
        ease: "steps(8)",
        absolute: true,
        scale: false,
        toggleClass: "virando",
      });
      if (aberto) {
        gsap.from("[data-revelar]", {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.24,
          ease: "steps(4)",
          stagger: 0.06,
          delay: 0.44,
          clearProps: "clipPath",
        });
      }
    },
    { scope: raiz, dependencies: [aberto] },
  );

  const projetoAberto = projetos.find((p) => p.id === aberto);

  return (
    <section
      ref={raiz}
      id="projetos"
      aria-labelledby="titulo-projetos"
      className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24"
      onKeyDown={(e) => {
        if (e.key === "Escape" && aberto) trocar(null);
      }}
    >
      <h2 id="titulo-projetos" className="pixel text-pixel-2 text-creme md:text-pixel-3">
        {titulo}
      </h2>
      <p className="mt-4 max-w-texto text-bruma">{texto}</p>

      <ul className="mt-20 flex flex-wrap items-end">
        {projetos.map((p, i) => {
          const [w, h] = TAMANHO[p.objeto];
          return [
            <li key={p.id} className="flex grow-3 basis-1/2 flex-col items-center md:basis-0">
              {aberto === p.id ? (
                <span className="flex w-full flex-col items-center">
                  <span className="vaga block" style={{ width: w * ESCALA, height: h * ESCALA }} aria-hidden="true" />
                  <Tabua rotulo={p.nome} />
                </span>
              ) : (
                <button
                  id={`objeto-${p.id}`}
                  type="button"
                  className="objeto flex w-full flex-col items-center"
                  aria-expanded={false}
                  aria-controls="painel-projeto"
                  data-cursor="lupa"
                  data-cursor-acao="abrir"
                  data-cursor-objeto={p.nome}
                  onClick={() => trocar(p.id)}
                >
                  <span data-flip-id={`moldura-${p.id}`} className="objeto-moldura block">
                    <Sprite regiao={p.objeto} escala={ESCALA} />
                  </span>
                  <span className="sr-only">
                    {p.nome}: {p.objetoDescricao}. Abrir o caso.
                  </span>
                  <Tabua rotulo={p.nome} />
                </button>
              )}
            </li>,
            ENFEITES[i] ? (
              <li key={`enfeite-${i}`} aria-hidden="true" className="hidden grow-2 basis-0 flex-col items-center md:flex">
                <span className="flex items-end gap-4">
                  {ENFEITES[i].map((r) => (
                    <Sprite key={r} regiao={r} escala={ESCALA} />
                  ))}
                </span>
                <Tabua />
              </li>
            ) : null,
          ];
        })}
      </ul>

      <div id="painel-projeto">
        {projetoAberto && (
          <article
            key={projetoAberto.id}
            data-flip-id={`moldura-${projetoAberto.id}`}
            aria-labelledby="titulo-projeto"
            className="moldura mt-20 overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-10 p-6 md:p-10">
              <header className="flex flex-wrap items-end gap-6">
                <Sprite regiao={projetoAberto.objeto} escala={ESCALA} />
                <div className="flex min-w-60 flex-1 flex-col gap-2" data-revelar>
                  <h3 id="titulo-projeto" tabIndex={-1} className="pixel text-pixel-2 text-creme md:text-pixel-3">
                    {projetoAberto.nome}
                  </h3>
                  <p className="text-bruma">{projetoAberto.resumo}</p>
                  <p className="pixel text-pixel-2 text-salvia">{projetoAberto.quando}</p>
                </div>
                <div className="flex flex-wrap gap-6" data-revelar>
                  <a className="botao" href={projetoAberto.url} target="_blank" rel="noreferrer">
                    Abrir o site
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                  <button type="button" className="botao botao-contorno" onClick={() => trocar(null)}>
                    Guardar
                  </button>
                </div>
              </header>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {(
                  [
                    ["O problema", projetoAberto.problema],
                    ["A decisão", projetoAberto.decisao],
                    ["O resultado", projetoAberto.resultado],
                  ] as const
                ).map(([rotulo, conteudo]) => (
                  <div key={rotulo} className="flex flex-col gap-3" data-revelar>
                    <h4 className="pixel text-pixel-2 text-ambar">{rotulo}</h4>
                    <p className="text-creme">{conteudo}</p>
                  </div>
                ))}
              </div>
              <p className="border-t-4 border-linha pt-6 text-bruma" data-revelar>
                <span className="pixel mr-3 text-pixel-2 text-rosa">Feito com</span>
                {projetoAberto.feitoCom}
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

"use client";
/**
 * Projetos como objetos numa prateleira. Abrir um objeto usa GSAP Flip:
 * a moldura do objeto é a mesma moldura do painel — ela cresce até virar o painel.
 */
import { type CSSProperties, useRef, useState } from "react";
import type { Projeto } from "@/conteudo/projetos";
import { Sprite } from "@/componentes/arte/Sprite";
import type { NomeRegiao } from "@/arte/folha";
import { Flip, gsap, prefereMenosMovimento, useGSAP } from "@/componentes/movimento/gsap";

interface Props {
  projetos: Projeto[];
  titulo: string;
  texto: string;
}

const TAMANHO = {
  cartucho: [30, 36],
  fichario: [26, 42],
  guia: [30, 40],
  "caixa-deck": [28, 42],
  "caixa-loja": [34, 36],
} as const;
const ESCALA = 4;
/** Objetos por tábua: 2 no celular, 3 a partir do tablet. Cada objeto ocupa 2 colunas da grade. */
const POR_TABUA_CELULAR = 2;
const POR_TABUA_TABLET = 3;
/**
 * Enfeites entre os objetos, só a partir do tablet: a chave é o índice do projeto que vem antes.
 * Nenhuma chave pode ser o último objeto de uma tábua do tablet (índices 2, 5…), senão o enfeite fica na borda.
 */
const ENFEITES: Record<number, NomeRegiao[]> = { 0: ["suculenta"], 1: ["controle", "caneca"], 3: ["gato-0"] };

/**
 * Lugar de cada objeto na grade de 2 × porTabua colunas: numa tábua cheia, cada um ocupa 2 colunas.
 * A última tábua, quando não enche, continua de ponta a ponta e fica centralizada: o primeiro e o último
 * objeto dela ganham as colunas que sobram de cada lado, com um recuo do mesmo tamanho, e os objetos
 * caem no meio do vão entre os da tábua de cima, como tijolos.
 */
function lugar(i: number, total: number, porTabua: number) {
  const inicioUltima = Math.floor((total - 1) / porTabua) * porTabua;
  const naUltima = total - inicioUltima;
  const sobra = porTabua - naUltima;
  const posicao = i % porTabua;
  if (i < inicioUltima || sobra === 0) return { coluna: `${posicao * 2 + 1} / span 2`, esquerda: "0%", direita: "0%" };
  if (naUltima === 1) return { coluna: "1 / -1", esquerda: "0%", direita: "0%" };
  const primeiro = posicao === 0;
  const ultimo = posicao === naUltima - 1;
  const largura = 2 + (primeiro ? sobra : 0) + (ultimo ? sobra : 0);
  const recuo = (colunas: number) => `${(colunas / largura) * 100}%`;
  return {
    coluna: `${primeiro ? 1 : sobra + posicao * 2 + 1} / span ${largura}`,
    esquerda: primeiro ? recuo(sobra) : "0%",
    direita: ultimo ? recuo(sobra) : "0%",
  };
}

function estiloDoLugar(i: number, total: number): CSSProperties {
  const celular = lugar(i, total, POR_TABUA_CELULAR);
  const tablet = lugar(i, total, POR_TABUA_TABLET);
  return {
    "--coluna": celular.coluna,
    "--esquerda": celular.esquerda,
    "--direita": celular.direita,
    "--coluna-md": tablet.coluna,
    "--esquerda-md": tablet.esquerda,
    "--direita-md": tablet.direita,
  } as CSSProperties;
}

/**
 * O vão da tábua e o nome embaixo dela. A tábua é desenhada pelo item da grade, de ponta a ponta,
 * a 44px da base: 12px de margem + 32px do nome, que fica numa linha só.
 */
function Rotulo({ texto }: { texto: string }) {
  return (
    <>
      <span className="block h-4" aria-hidden="true" />
      <span className="pixel mt-3 block min-h-8 text-center text-pixel-1 whitespace-nowrap text-bruma md:text-pixel-2" aria-hidden="true">
        {texto}
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

      <ul className="mt-12 grid grid-cols-4 items-end gap-y-12 md:grid-cols-6">
        {projetos.map((p, i) => {
          const [w, h] = TAMANHO[p.objeto];
          return (
            <li
              key={p.id}
              className="relative flex justify-center col-(--coluna) pr-(--direita) pl-(--esquerda) md:col-(--coluna-md) md:pr-(--direita-md) md:pl-(--esquerda-md)"
              style={estiloDoLugar(i, projetos.length)}
            >
              <span className="tabua absolute inset-x-0 bottom-11" aria-hidden="true" />
              {aberto === p.id ? (
                <span className="flex flex-col items-center">
                  <span className="vaga block" style={{ width: w * ESCALA, height: h * ESCALA }} aria-hidden="true" />
                  <Rotulo texto={p.nome} />
                </span>
              ) : (
                <button
                  id={`objeto-${p.id}`}
                  type="button"
                  className="objeto flex flex-col items-center"
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
                  <Rotulo texto={p.nome} />
                </button>
              )}
              {ENFEITES[i] && (
                // na divisa entre este objeto e o próximo, em pé sobre a tábua (44px + 16px da tábua)
                <span aria-hidden="true" className="absolute right-0 bottom-15 hidden translate-x-1/2 items-end gap-4 md:flex">
                  {ENFEITES[i].map((r) => (
                    <Sprite key={r} regiao={r} escala={ESCALA} />
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div id="painel-projeto">
        {projetoAberto && (
          <article
            key={projetoAberto.id}
            data-flip-id={`moldura-${projetoAberto.id}`}
            aria-labelledby="titulo-projeto"
            className="moldura mt-12 overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-10 p-6 md:p-10">
              <header className="flex flex-wrap items-end gap-6">
                <Sprite regiao={projetoAberto.objeto} escala={ESCALA} />
                <div className="flex min-w-60 flex-1 flex-col gap-2" data-revelar>
                  <h3 id="titulo-projeto" tabIndex={-1} className="pixel text-pixel-2 text-creme md:text-pixel-3">
                    {projetoAberto.nome}
                  </h3>
                  <p className="text-bruma">{projetoAberto.resumo}</p>
                  <p className="pixel text-pixel-2 text-ambar">{projetoAberto.quando}</p>
                  {projetoAberto.acesso && <p className="text-miudo text-bruma">{projetoAberto.acesso}</p>}
                </div>
                <div className="flex flex-wrap gap-6" data-revelar>
                  <a className="botao" href={projetoAberto.url} target="_blank" rel="noreferrer">
                    {projetoAberto.link === "demo" ? "Abrir a demo" : "Abrir o site"}
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
                    <h4 className="pixel text-pixel-2 text-salvia">{rotulo}</h4>
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

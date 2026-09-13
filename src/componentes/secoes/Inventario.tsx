"use client";
/**
 * Stack como inventário de RPG: grade de espaços navegável por setas, descrição do item ao lado.
 * O número no canto é real — em quantos projetos o item entrou — e não uma barra de "proficiência".
 */
import { useRef, useState } from "react";
import type { NomeRegiao } from "@/arte/folha";
import type { Item } from "@/conteudo/inventario";
import { Sprite } from "@/componentes/arte/Sprite";

interface Props {
  itens: Item[];
  total: number;
  titulo: string;
  texto: string;
}

const COLUNAS_DESKTOP = 6;
const ESPACOS = 18;

export function Inventario({ itens, total, titulo, texto }: Props) {
  const [selecionado, setSelecionado] = useState(0);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const item = itens[selecionado];

  function mover(para: number) {
    const alvo = (para + itens.length) % itens.length;
    setSelecionado(alvo);
    botoes.current[alvo]?.focus();
  }

  function colunasAtuais(): number {
    const lista = botoes.current[0]?.closest("ul");
    if (!lista) return COLUNAS_DESKTOP;
    return getComputedStyle(lista).gridTemplateColumns.split(" ").length;
  }

  function teclado(e: React.KeyboardEvent, i: number) {
    const colunas = colunasAtuais();
    const acoes: Record<string, () => void> = {
      ArrowRight: () => mover(i + 1),
      ArrowLeft: () => mover(i - 1),
      ArrowDown: () => mover(Math.min(itens.length - 1, i + colunas)),
      ArrowUp: () => mover(Math.max(0, i - colunas)),
      Home: () => mover(0),
      End: () => mover(itens.length - 1),
    };
    const acao = acoes[e.key];
    if (acao) {
      e.preventDefault();
      acao();
    }
  }

  return (
    <section id="inventario" aria-labelledby="titulo-inventario" className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24">
      <h2 id="titulo-inventario" className="pixel text-pixel-2 text-creme md:text-pixel-3">
        {titulo}
      </h2>
      <p className="mt-4 max-w-texto text-bruma">{texto}</p>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <ul className="inventario-grade grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Itens do inventário">
            {Array.from({ length: ESPACOS }, (_, i) => {
              const it = itens[i];
              if (!it) {
                return <li key={`vazio-${i}`} className="espaco espaco-vazio" aria-hidden="true" />;
              }
              const ativo = i === selecionado;
              return (
                <li key={it.id}>
                  <button
                    ref={(el) => {
                      botoes.current[i] = el;
                    }}
                    type="button"
                    className="espaco relative grid w-full place-items-center"
                    data-ativo={ativo}
                    aria-pressed={ativo}
                    tabIndex={ativo ? 0 : -1}
                    onClick={() => setSelecionado(i)}
                    onMouseEnter={() => setSelecionado(i)}
                    onFocus={() => setSelecionado(i)}
                    onKeyDown={(e) => teclado(e, i)}
                  >
                    <Sprite regiao={it.icone as NomeRegiao} escala={3} />
                    <span className="sr-only">{it.nome}</span>
                    <span className="pixel absolute right-1 bottom-0 text-pixel-1 text-creme" aria-hidden="true">
                      ×{it.projetos.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="pixel mt-5 hidden text-pixel-1 text-bruma md:block">setas do teclado também andam pelos espaços</p>
        </div>

        <div className="moldura self-start px-6 py-6 lg:col-span-5" aria-live="polite">
          <div className="flex items-center gap-4">
            <Sprite regiao={item.icone as NomeRegiao} escala={4} />
            <div>
              <h3 className="pixel text-pixel-2 text-creme">{item.nome}</h3>
              <p className="pixel text-pixel-2 text-ambar">
                em {item.projetos.length} de {total} projetos
              </p>
            </div>
          </div>
          <h4 className="pixel mt-6 text-pixel-2 text-salvia">onde</h4>
          <p className="text-creme">{item.projetos.join(", ")}</p>
          <h4 className="pixel mt-4 text-pixel-2 text-salvia">como</h4>
          <p className="text-creme">{item.como}</p>
        </div>
      </div>
    </section>
  );
}

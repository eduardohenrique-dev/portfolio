import { SOBRE } from "@/conteudo/perfil";
import { Sprite } from "@/componentes/arte/Sprite";

interface Props {
  comTerminal: boolean;
}

export function Sobre({ comTerminal }: Props) {
  const [primeiro, ...resto] = comTerminal ? [...SOBRE.paragrafos, SOBRE.paragrafoTerminal] : SOBRE.paragrafos;
  return (
    <section id="quem-sou" aria-labelledby="titulo-quem-sou" className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 id="titulo-quem-sou" className="pixel text-pixel-2 text-creme md:text-pixel-3">
            {SOBRE.titulo}
          </h2>
          <div className="mt-10 hidden items-end gap-4 lg:flex">
            <Sprite regiao="andarilho-0" escala={4} />
            <Sprite regiao="gato-0" escala={4} />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-8">
          <p className="max-w-texto text-destaque text-creme">{primeiro}</p>
          {resto.map((p) => (
            <p key={p.slice(0, 24)} className="max-w-texto text-bruma">
              {p}
            </p>
          ))}
          <dl className="moldura mt-6 grid max-w-texto gap-x-8 gap-y-2 bg-fundo p-6 sm:grid-cols-[max-content_1fr]">
            {SOBRE.nota.map(([rotulo, valor]) => (
              <div key={rotulo} className="contents">
                <dt className="pixel text-pixel-2 text-ambar">{rotulo}</dt>
                <dd className="text-creme">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

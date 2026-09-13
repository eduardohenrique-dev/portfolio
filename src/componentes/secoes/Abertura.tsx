import { ABERTURA, PERFIL } from "@/conteudo/perfil";
import { Cena } from "@/componentes/arte/Cena";
import { TituloAbertura } from "./TituloAbertura";

export function Abertura() {
  return (
    <section id="inicio" aria-labelledby="titulo-inicio" className="abertura relative">
      {/* a abertura ocupa a largura toda: a cena só cresce em múltiplos inteiros e precisa de espaço para chegar a 2× e 3× */}
      <div className="grid grid-cols-1 gap-12 px-5 pt-28 pb-16 md:px-10 xl:sticky xl:top-0 xl:h-dvh xl:grid-cols-12 xl:items-center xl:gap-8 xl:pt-0 xl:pr-6 xl:pb-0 xl:pl-16">
        <div className="mx-auto flex w-full max-w-pagina flex-col gap-6 xl:col-span-5 xl:mx-0">
          <TituloAbertura texto={PERFIL.nome} />
          <p className="max-w-texto text-destaque text-creme">{ABERTURA.lead}</p>
          <p className="text-bruma">{ABERTURA.linha}</p>
          <div className="mt-4 flex flex-wrap gap-6">
            <a className="botao" href="#projetos">
              Ver os projetos
            </a>
            <a className="botao botao-contorno" href="#contato">
              Mandar um e-mail
            </a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-pagina xl:col-span-7 xl:max-w-none">
          <Cena
            composicao="responsiva"
            horarioParado={1}
            interativa
            entrada
            gatilhoParallax="#inicio"
            rotulo="Ilustração em pixel art de um quarto visto de cima: mesa com monitor, luminária articulada, prateleira com livros, um quadro de post-its, um gato dormindo na janela e, lá fora, o Pico da Ibituruna. A luz muda do fim de tarde até a noite conforme a página rola."
          />
        </div>
      </div>
    </section>
  );
}

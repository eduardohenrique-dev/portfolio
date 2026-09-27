import { ABERTURA, PERFIL } from "@/conteudo/perfil";
import { Cena } from "@/componentes/arte/Cena";
import { TituloAbertura } from "./TituloAbertura";

export function Abertura() {
  return (
    <section id="inicio" aria-labelledby="titulo-inicio" className="abertura relative">
      {/* no desktop largo a cena vai até a borda da tela: ela só cresce em múltiplos inteiros e precisa de espaço para chegar a 2× e 3× */}
      <div className="abertura-grade grid grid-cols-1 gap-12 px-5 pt-28 pb-16 md:px-10 xl:sticky xl:top-0 xl:h-dvh xl:items-center xl:gap-8 xl:pt-0 xl:pr-6 xl:pb-0">
        <div className="mx-auto flex w-full max-w-conteudo flex-col gap-6 xl:mx-0 xl:max-w-none">
          <TituloAbertura texto={PERFIL.nome} />
          <p className="max-w-texto text-destaque text-creme">{ABERTURA.lead}</p>
          <p className="text-bruma">{ABERTURA.linha}</p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:flex-wrap">
            <a className="botao justify-center" href="#projetos">
              Ver os projetos
            </a>
            <a className="botao botao-contorno justify-center" href="#contato">
              Mandar um e-mail
            </a>
          </div>
        </div>
        {/* no celular a cena sai do respiro lateral: com a largura toda, chega a 2× numa tela de 390px */}
        <div className="mx-auto w-full max-w-conteudo max-sm:-mx-5 max-sm:w-auto xl:max-w-none">
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

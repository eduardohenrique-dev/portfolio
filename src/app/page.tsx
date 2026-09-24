import { Cursor } from "@/componentes/cursor/Cursor";
import { Hud } from "@/componentes/Hud";
import { MovimentoRaiz } from "@/componentes/movimento/MovimentoRaiz";
import { Abertura } from "@/componentes/secoes/Abertura";
import { Contato } from "@/componentes/secoes/Contato";
import { Inventario } from "@/componentes/secoes/Inventario";
import { Prateleira } from "@/componentes/secoes/Prateleira";
import { Rodape } from "@/componentes/secoes/Rodape";
import { Sobre } from "@/componentes/secoes/Sobre";
import { Terminal } from "@/componentes/secoes/Terminal";
import { Trajetoria } from "@/componentes/secoes/Trajetoria";
import { INVENTARIO, TOTAL_PROJETOS } from "@/conteudo/inventario";
import { CONTATO, PERFIL } from "@/conteudo/perfil";
import { PROJETOS } from "@/conteudo/projetos";
import { TERMINAL } from "@/conteudo/terminal";
import { AGORA, TRAJETORIA } from "@/conteudo/trajetoria";

const SECOES = [
  { id: "inicio", rotulo: "início" },
  { id: "quem-sou", rotulo: "quem sou" },
  { id: "projetos", rotulo: "projetos" },
  { id: "inventario", rotulo: "inventário" },
  { id: "trajetoria", rotulo: "trajetória" },
  { id: "terminal", rotulo: "terminal" },
  { id: "contato", rotulo: "contato" },
];

export default function Pagina() {
  // Sem a chave, o terminal só teria respostas prontas, e demo de IA simulada não entra: saem a seção
  // e as frases que apontam para ela. A página é estática, então a chave é conferida no build.
  const comTerminal = Boolean(process.env.ANTHROPIC_API_KEY);
  const secoes = comTerminal ? SECOES : SECOES.filter((s) => s.id !== "terminal");
  const itens = comTerminal ? INVENTARIO : INVENTARIO.filter((i) => !i.soComTerminal);
  const marcos = TRAJETORIA.map(({ textoSemTerminal, ...marco }) =>
    comTerminal || !textoSemTerminal ? marco : { ...marco, texto: textoSemTerminal },
  );

  return (
    <>
      <MovimentoRaiz />
      <Hud secoes={secoes} />
      <Cursor />
      <main id="conteudo" tabIndex={-1}>
        <Abertura />
        <Sobre comTerminal={comTerminal} />
        <Prateleira
          projetos={PROJETOS}
          titulo="Seis projetos no ar"
          texto="Escolha um objeto da prateleira para abrir o caso: o problema, a decisão técnica e o resultado. Os sistemas de uso interno abrem numa demo com dados fictícios."
        />
        <Inventario
          itens={itens}
          total={TOTAL_PROJETOS}
          titulo="Inventário"
          texto={`O que eu levo para os projetos. O número no canto de cada espaço é em quantos deles o item entrou — contando os seis da prateleira e este site, ${TOTAL_PROJETOS} ao todo.`}
        />
        <Trajetoria marcos={marcos} agora={AGORA} titulo="Trajetória" texto="Do primeiro repositório de curso a este site, em ordem." />
        {comTerminal && (
          <Terminal titulo={TERMINAL.titulo} texto={TERMINAL.texto} boasVindas={TERMINAL.boasVindas} sugestoes={TERMINAL.sugestoes} />
        )}
        <Contato titulo={CONTATO.titulo} texto={CONTATO.texto} email={PERFIL.email} github={PERFIL.github} linkedin={PERFIL.linkedin} />
      </main>
      <Rodape comTerminal={comTerminal} />
    </>
  );
}

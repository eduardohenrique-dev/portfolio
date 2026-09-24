import { AlternarCursor } from "@/componentes/cursor/AlternarCursor";
import { COLOFAO, PERFIL } from "@/conteudo/perfil";

interface Props {
  comTerminal: boolean;
}

export function Rodape({ comTerminal }: Props) {
  return (
    <footer className="border-t-4 border-linha">
      <div className="mx-auto flex max-w-pagina flex-col gap-4 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex max-w-texto flex-col items-start gap-2">
          <p className="text-miudo text-bruma">{comTerminal ? COLOFAO.comTerminal : COLOFAO.semTerminal}</p>
          <AlternarCursor />
        </div>
        <p className="pixel text-pixel-2 text-bruma">© 2026 {PERFIL.nomeCompleto}</p>
      </div>
    </footer>
  );
}

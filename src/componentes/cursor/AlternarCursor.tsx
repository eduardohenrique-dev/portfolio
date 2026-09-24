"use client";
/**
 * Botão do rodapé para trocar o cursor em pixel art pelo do sistema (e voltar).
 * Só aparece com mouse e fora do alto contraste, onde o cursor em pixel art existe.
 */
import { useSyncExternalStore } from "react";
import { assinarCursorPixel, cursorPixelLigado, definirCursorPixel } from "./preferencia";

export function AlternarCursor() {
  const ligado = useSyncExternalStore(assinarCursorPixel, cursorPixelLigado, () => true);
  return (
    <button
      type="button"
      className="link hidden text-left text-miudo pointer-fine:not-forced-colors:inline"
      onClick={() => definirCursorPixel(!ligado)}
    >
      {ligado ? "Usar o cursor do sistema" : "Voltar ao cursor em pixel art"}
    </button>
  );
}

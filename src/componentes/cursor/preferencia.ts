/**
 * Escolha do visitante entre o cursor em pixel art e o do sistema.
 * Fica no localStorage, só neste navegador. Sem acesso a ele, a troca vale até recarregar a página.
 * Com o do sistema, o <html> ganha CLASSE_SISTEMA e o CSS deixa de trocar a imagem do cursor.
 */
export const CHAVE_CURSOR = "cursor";
export const VALOR_SISTEMA = "sistema";
export const CLASSE_SISTEMA = "cursor-do-sistema";

/** Roda no <head>, antes da primeira pintura: quem escolheu o cursor do sistema não vê o de pixel piscar. */
export const SCRIPT_PREFERENCIA_CURSOR = `try{if(localStorage.getItem(${JSON.stringify(CHAVE_CURSOR)})===${JSON.stringify(VALOR_SISTEMA)})document.documentElement.classList.add(${JSON.stringify(CLASSE_SISTEMA)})}catch(e){}`;

type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();
let ligado: boolean | null = null;

export function cursorPixelLigado(): boolean {
  if (ligado === null) {
    try {
      ligado = localStorage.getItem(CHAVE_CURSOR) !== VALOR_SISTEMA;
    } catch {
      ligado = true;
    }
  }
  return ligado;
}

export function definirCursorPixel(valor: boolean) {
  ligado = valor;
  try {
    if (valor) localStorage.removeItem(CHAVE_CURSOR);
    else localStorage.setItem(CHAVE_CURSOR, VALOR_SISTEMA);
  } catch {
    // sem armazenamento: fica só na memória
  }
  document.documentElement.classList.toggle(CLASSE_SISTEMA, !valor);
  for (const o of ouvintes) o();
}

export function assinarCursorPixel(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

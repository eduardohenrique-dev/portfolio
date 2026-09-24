import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import localFont from "next/font/local";
import { SCRIPT_PREFERENCIA_CURSOR } from "@/componentes/cursor/preferencia";
import { PERFIL } from "@/conteudo/perfil";
import "./globals.css";

const pixel = localFont({
  src: "./fontes/ibituruna.otf",
  variable: "--fonte-pixel",
  display: "swap",
  adjustFontFallback: false,
});

const texto = Inter_Tight({
  subsets: ["latin"],
  variable: "--fonte-texto",
  display: "swap",
});

const URL_SITE =
  process.env.NEXT_PUBLIC_URL_SITE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const TITULO = "Eduardo Henrique, full stack e UX/UI";
const DESCRICAO =
  "Portfólio de Eduardo Henrique, desenvolvedor full stack e designer de interface em Governador Valadares (MG). Sistemas para um time de esports e para uma loja de games, um guia de negócios de Valadares e um scanner de cartas de Magic.";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: TITULO,
  description: DESCRICAO,
  applicationName: "Eduardo Henrique",
  authors: [{ name: PERFIL.nomeCompleto, url: PERFIL.github }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Eduardo Henrique",
    title: TITULO,
    description: DESCRICAO,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Ilustração em pixel art de um quarto com mesa de trabalho no fim da tarde, ao lado do nome Eduardo Henrique.",
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#2a2030",
  colorScheme: "dark",
};

const pessoa = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PERFIL.nomeCompleto,
  alternateName: PERFIL.nome,
  jobTitle: "Desenvolvedor full stack e designer de UX/UI",
  address: { "@type": "PostalAddress", addressLocality: "Governador Valadares", addressRegion: "MG", addressCountry: "BR" },
  email: `mailto:${PERFIL.email}`,
  url: URL_SITE,
  sameAs: [PERFIL.github, PERFIL.linkedin],
  knowsLanguage: ["pt-BR", "en"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${pixel.variable} ${texto.variable}`} suppressHydrationWarning>
      <head>
        {/* antes da primeira pintura: marca que há JS (o título só se esconde se for ser animado)
            e aplica a escolha de cursor do visitante */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("js");${SCRIPT_PREFERENCIA_CURSOR}` }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pessoa).replace(/</g, "\\u003c") }}
        />
        <a href="#conteudo" className="pular botao">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}

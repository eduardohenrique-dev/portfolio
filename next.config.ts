import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Demos estáticas (dados fictícios) em public/demos/<nome>/index.html,
  // servidas em /demos/<nome> — o Next não resolve index.html de pasta sozinho.
  async rewrites() {
    return [{ source: "/demos/:nome", destination: "/demos/:nome/index.html" }];
  },
  async headers() {
    return [
      {
        // sprites e mapas de luz têm hash no nome: podem ficar em cache para sempre
        source: "/arte/:arquivo*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:caminho*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

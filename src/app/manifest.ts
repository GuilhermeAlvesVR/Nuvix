import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nuvix Consultórios",
    short_name: "Nuvix",
    description: "Sistema para gestão de consultórios, pacientes, consultas e financeiro.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#116466",
    icons: [
      { src: "/brand/nuvix-logo.png", sizes: "any", type: "image/png", purpose: "any" },
    ],
  };
}

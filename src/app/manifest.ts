import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nuvix Consultórios",
    short_name: "Nuvix",
    description: "Sistema para gestão de consultórios, pacientes, consultas e financeiro.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f3ee",
    theme_color: "#116466",
    categories: ["business", "productivity", "medical"],
    icons: [
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
      { src: "/brand/nuvix-logo.png", sizes: "any", type: "image/png", purpose: "any" },
    ],
  };
}

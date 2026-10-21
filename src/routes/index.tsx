import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/game/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Neon Courier — 3D Endless Runner" },
      { name: "description", content: "Dodge, jump and slide through a neon night city in this original 3-lane endless runner." },
      { property: "og:title", content: "Neon Courier — 3D Endless Runner" },
      { property: "og:description", content: "Dodge, jump and slide through a neon night city in this original 3-lane endless runner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

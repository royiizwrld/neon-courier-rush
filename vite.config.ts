// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Dev-only: TanStack devtools injects `data-tsd-source` props into every JSX element.
 * react-three-fiber treats dashed props as nested paths ("data.tsd.source") and throws.
 * Strip them from the 3D game files, which render R3F elements.
 */
function stripTsdSourceInGame(): Plugin {
  return {
    name: "strip-tsd-source-in-game",
    enforce: "post",
    apply: "serve",
    transform(code, id) {
      if (!id.includes("/src/game/") || !code.includes("data-tsd-source")) return null;
      return { code: code.replace(/["']?data-tsd-source["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|\{\s*"[^"]*"\s*\}),?/g, ""), map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [stripTsdSourceInGame()] },
});

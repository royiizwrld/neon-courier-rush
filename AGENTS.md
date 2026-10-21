<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Game architecture
- Game code lives in `src/game/`, one folder per system (loop, input, player, track, obstacles, collision, coins, ui, ...); the route only mounts `<Game />` with `ssr: false` because WebGL is browser-only.
- Per-frame state lives in the mutable `run` object (`src/game/runtime.ts`), not React state; zustand (`store.ts`) holds UI phase and persisted values, updated at ~10Hz to avoid re-renders.
- One `GameLoop` useFrame owns simulation; render components only read `run`. Objects are pooled (fixed arrays / instanced meshes) — never allocate in the frame loop.
- Row generation must go through `makeRow`/`isFair` in `track/patterns.ts`, which guarantee an open lane; keep its tests passing.

# Neon Courier: 3D Endless Runner

An original lane runner. A courier named "Vex" runs through a neon night city while a security drone called "Warden" chases him. Everything is drawn in code from low-poly shapes, with no outside models or images. We build it in 7 parts, in order, and the game must stay playable after each one.

## Build order (one part per approval step)
1. **Core gameplay**: camera, an endless 3-lane track that reuses its pieces, the runner and animation, swipe and keyboard controls, 4 obstacle types, fair patterns, coins, collisions, score, start/HUD/pause/game-over screens, local saves, mobile lockdown (no scrolling or zooming), FPS debug (press F3 or triple-tap the top corner).
2. **Biomes and portals**: biome system plus 8 biomes, each with its own hazards. Portal gates every 400–700 m, a warp transition, golden bonus portals, and the Track Journal.
3. **Chaser and power-ups**: the two-hit chaser rule, bottles you can throw, magnet, x2 score, jetpack, shield.
4. **Missions, daily reward, shop**: skins with a rotating preview and power-up upgrades from level 1 to 5.
5. **Polish**: camera feel, pooled particles, screen shake and slow motion, synthesized audio for each biome, vibration, 3-2-1 countdown, automatic quality drop when the frame rate falls.
6. **Difficulty, settings, install**: difficulty curve, input buffering, tutorial, settings screen, auto-pause, installable app (PWA) with a safe production-only service worker and iPhone instructions.
7. **Accounts and leaderboard (optional)**: Lovable Cloud sign-up, cross-device sync, leaderboard tabs, score submission checked on the server with plausibility limits and rate limits, row-level security, nickname filter, guest import, Terms and Privacy pages, account deletion.

If a part runs long, I'll stop at a clean point and tell you which part to continue from.

## Visual direction
Rain-soaked city at night: deep ink-blue background, magenta and cyan glowing signs, amber coins, and the track's tile pattern drawn in code. A condensed display font (Bebas Neue) for headings and Barlow for UI text. Each biome brings its own colors.

## Technical details
- Stack: three, @react-three/fiber 9, drei 10, zustand for the game store. The game route has `ssr: false`.
- Folders:
```text
src/game/
  store.ts           zustand: phase, score, coins, speed, settings, persistence
  constants.ts       lanes, speeds, gravity, feel constants
  loop/GameLoop.tsx  single useFrame driver (clamped delta), ordered systems
  input/input.ts     swipe + keys, buffered actions
  player/Player.tsx  runner model + animation, physics state
  track/TrackGenerator.ts  segment pool + pattern spawner (safe-path guarantee)
  track/Track.tsx, Scenery.tsx
  obstacles/         types, pooled instances
  collision/collision.ts   AABB with forgiving margins
  coins/Coins.tsx    instanced coins + pickup fx
  biomes/            registry + one file per biome (palette, fog, hazards, ambience)
  portals/           gate spawner, warp effect, journal
  chaser/, powerups/, missions/, shop/, audio/ (Web Audio synth), fx/ (particles)
  ui/                StartScreen, HUD, Pause, GameOver, Shop, Journal, Settings, Tutorial
src/routes/index.tsx  mounts the game
```
- Performance: shared geometries and materials, instanced meshes for coins and scenery, no allocations inside the frame loop (temporary vectors are reused), dpr capped at [1,2], one directional shadow, and biome assets disposed when a biome is unloaded.
- Fairness: patterns are rows across the 3 lanes. The spawner checks that at least one lane can be reached from the previous row's open lane, and the minimum gap between rows grows with speed × reaction time.
- Unit tests for the pattern-fairness check, the score formula, and the chaser two-hit rule.
- Part 1 is verified with Playwright screenshots before moving on.

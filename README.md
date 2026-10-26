# Neon Courier Rush

Build a complete 3D endless runner game for mobile and desktop browsers, in the style of lane-based runners (three lanes, swipe to dodge, jump and slide, collect coins, avoid obstacles). Use ORIGINAL characters, names and art; do not copy any existing game's characters, logos or assets. Theme of the starting track: a courier running through a neon night city (the theme can be changed freely later). Use Three.js with react-three-fiber and @react-three/drei, with simple low-poly shapes and materials created in code (no external models or textures required).

Work in the numbered parts below, in order. Finish and confirm each part works before starting the next. Keep the code organized in separate files (game loop, input, player, track generator, biomes, portals, obstacles, collision, chaser, power-ups, missions, shop, audio, UI screens, shared game state store). If a part cannot be completed in one go, stop at a clean point and tell me exactly which part to continue from.

PART 1: CORE GAMEPLAY
Camera & track
- Third-person camera behind and above the runner, looking forward, with perspective and fog in the distance so new segments fade in.
- A 3-lane track made of segments that are spawned ahead and recycled (object pooling) once they pass behind the camera, so the track feels endless without creating new objects every frame.
- Scenery on both sides that also recycles.
Player
- The runner moves forward automatically. Controls: swipe left/right to change lane, swipe up to jump, swipe down to roll/slide. On desktop: arrow keys or A/D/W/S.
- Smooth eased lane changes, a jump with gravity, a slide that lowers the hitbox for about 0.7 seconds, and a swipe down in mid-air to drop faster.
- Build the runner from simple shapes with a running animation (swinging arms and legs, a lean when changing lanes).
Obstacles & coins
- Obstacle types: low barrier (jump over), high barrier (slide under), full block or parked vehicle (change lane), and a moving vehicle in a lane.
- Spawn patterns fairly: always leave at least one safe path, never block all three lanes at once, and leave enough room to react as speed increases.
- Coins in lines and arcs across lanes, with a pickup effect.
Game logic
- Use delta time so the game runs at the same speed on 60Hz and 120Hz screens. Speed increases gradually up to a maximum.
- Collision detection with simple bounding boxes. Score based on distance plus a bonus per coin.
- Screens: start screen (title, 'Tap to play', best score), HUD (score, coins, pause button), pause screen, and a game over screen (score, best score, coins, 'Play again' and 'Home').
- Save best score and total coins in localStorage.
Performance & mobile
- Reuse geometries and materials, avoid creating objects inside the render loop, cap pixel ratio at 2, and keep draw calls low.
- Fill the screen, prevent page scroll, zoom and pull-to-refresh while playing, and prefer portrait layout.
- A hidden debug mode (toggle with a key or triple tap) showing the FPS.

PART 2: MULTIPLE TRACKS (BIOMES) & PORTALS
Biomes
- Create a system where each 'track' is a biome with its own look and rules: color palette, fog color and density, lighting, sky or ceiling, scenery pieces, ground material, background ambience (synthesized), coin color accent, and 1 to 2 unique obstacles or hazards. All biomes keep the same 3-lane gameplay and must stay fair and passable.
- Build at least these 8 biomes with simple low-poly art:
  1. Neon City (starting track): glowing signs, parked vehicles, rain-slick street.
  2. Sewers: curved tunnel walls, pipes, dripping water, green-tinted fog. Hazards: low pipes to slide under, sludge puddles to jump over, steam vents that burst on a rhythm.
  3. Misty Forest: tall trees, ferns, fireflies, soft fog. Hazards: fallen logs to jump, low branches to slide under, rolling boulders in one lane.
  4. Ice Caverns: blue crystals, frosty glow. Hazards: icicles hanging in a lane (change lane), slippery patches where lane changes slide a little further.
  5. Desert Canyon: red cliffs, sand, wind-blown dust. Hazards: cacti, rock arches to slide under, tumbleweeds rolling across lanes.
  6. Lava Tunnel: glowing orange cracks, ember particles. Hazards: lava gaps to jump (always with a safe lane), falling rocks marked by a warning shadow.
  7. Sky Rooftops: city rooftops at sunset with gaps between buildings. Hazards: air vents, antenna poles, gaps to jump.
  8. Crystal Space Station: floating platforms, stars, low-gravity feel (slightly longer jumps). Hazards: drones and sliding doors.
- Only keep the current biome's assets in memory plus the next one being prepared, and dispose of unused geometries and materials, so performance stays smooth on phones.
Portals
- Every 400 to 700 meters (randomized), a portal gate appears on the track. Show 2 or 3 glowing portals, one in each lane, each with a clear icon and color for the biome it leads to (never the biome the player is already in). Sometimes one lane stays open as 'continue on this track'.
- The player chooses a destination by running through a portal in that lane. Warn the player a few seconds ahead with a pulsing 'Portal ahead' indicator and a gentle sound.
- Transition: a 2 to 3 second warp effect (flash, streaking lines or a swirling tunnel, field of view stretch) during which the player is safe, a trail of bonus coins leads through, and the next biome is swapped in behind the effect. Show the new biome's name in a banner.
- Rare 'golden portals' lead to a short 15-second bonus zone filled with coins and no obstacles, then return to the previous biome.
- Each biome has its own pacing: introduce its unique obstacles gradually after the transition, with a short safe stretch first.
- Keep a 'Track Journal' that records which biomes the player has visited, with an icon for each, and mark undiscovered ones as locked silhouettes. Save it in localStorage.
- Missions can ask the player to 'Visit 3 different tracks in one run' (added in Part 4).

PART 3: CHASER & POWER-UPS
Chaser
- Add a chaser (an original character, for example a security drone) behind the runner. The first hit on a low obstacle makes the player stumble and the chaser gets close. A second hit within about 8 seconds ends the run. After 8 seconds without a hit, the chaser drops back. A hit on a full block still ends the run immediately.
- The chaser's look adapts to each biome (for example it wades through the sewer or glides through the forest).
Throwing
- The player can collect bottles on the track and tap a Throw button (spacebar on desktop) to hit the chaser, pushing it back for 3 seconds. Ammo is limited and shown in the HUD.
Power-ups (spawn occasionally, show a timer bar and icon in the HUD)
- Coin magnet: pulls nearby coins for 8 seconds.
- Score multiplier x2 for 10 seconds.
- Jetpack/hoverboard: the runner flies above obstacles along a coin-filled path for 6 seconds, then lands safely with short invincibility. It also flies safely through portal transitions.
- Shield: absorbs one hit.
- Each power-up has a distinct glowing pickup.

PART 4: MISSIONS, REWARDS & SHOP
- Three active missions at a time (for example: collect 100 coins in one run, jump 20 times, slide 15 times, reach 1,500 points, use 2 power-ups, visit 3 different tracks in one run, pass through a golden portal). Completing a mission gives bonus coins and a multiplier level, then a new mission appears.
- A daily reward on the start screen (bonus coins, streak counted by date).
- A shop screen where players spend coins on runner skins (different color schemes and simple accessories, all original), and on upgrades that extend power-up duration (levels 1 to 5, rising prices). Show owned, equipped and locked states, with the character rotating in a preview. Some skins unlock by discovering specific tracks.
- Save missions, progress, rewards, skins and upgrades in localStorage.

PART 5: POLISH & GAME FEEL
- Camera: slight follow lag and tilt on lane changes, field of view widening with speed.
- Neon look: emissive materials on signs and lane lines, glowing skies, soft shadows under the player, and distant moving background elements.
- Particles (lightweight and pooled): dust when running and landing, sparkles for coins, a burst on collision, and biome particles (steam, fireflies, embers, snow).
- Screen shake and brief slow motion on collision before the game over screen.
- Sound: synthesize all effects with the Web Audio API (no external files): coin, jump, slide, lane change, throw, crash, portal whoosh, and a looping background beat that changes character per biome. Add a mute button, remember the setting, and start audio only after the first user tap.
- Haptics with navigator.vibrate on collisions and milestones, where supported.
- Smooth UI transitions between states and a 3-2-1 countdown when resuming from pause.
- If the frame rate drops, automatically lower effects (particles and shadows) first.

PART 6: DIFFICULTY, SETTINGS & INSTALL
- Difficulty curve: gentle for the first 15 seconds, then more obstacle types and denser patterns, with moving vehicles after a few hundred meters. Every pattern in every biome must stay passable.
- Input buffering so a swipe made just before landing or just before a lane is free still counts, and slightly forgiving hitboxes.
- A first-time tutorial with animated hints (swipe left/right, up, down, and how portals work), with a 'Skip' button.
- A Settings screen with sound, vibration, high-contrast mode, reduced-motion mode (also tones down warp effects), and a 'Reset progress' option with confirmation.
- Pause automatically if the tab loses focus or the phone is locked.
- Make it installable as a PWA: manifest (name, icons, standalone display, portrait orientation, theme color taken from the game's existing colors), a service worker that only registers in production and caches only static assets, a custom install banner after the player's second run, and iPhone instructions (Share, then Add to Home Screen), since iOS does not support the install prompt.
- Make sure the game works fullscreen on mobile and respects phone safe areas.

PART 7: ACCOUNTS & ONLINE LEADERBOARD (OPTIONAL, BUILD LAST)
- Playing as a guest is always allowed. Use Lovable Cloud so players can sign up or log in (nickname, email, password) to save progress across devices: best score, total coins, skins, upgrades, missions, discovered tracks and settings.
- A leaderboard screen with tabs Today, This week, All time, showing the top 50 scores with nickname and rank, and highlighting the player's own position.
- Submit scores through an edge function, not directly from the browser. It checks the user is logged in, validates the score against plausible limits (maximum score per second of play, minimum run length), rate-limits submissions, and ignores impossible scores.
- Turn on row-level security so players can only change their own saved data, while everyone can read the leaderboard. Filter inappropriate nicknames.
- On first login, offer to import the guest progress saved on the device.
- Add simple Terms and Privacy pages (draft placeholder text) and an option to delete the account and its data.

QUALITY
- Keep the game playable at every stage. After each part, the game must still start, run and end correctly.
- When finished, list the files added or changed and explain how to test the game on a phone.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c96a2e3a-765c-434a-bdd3-45e929433699).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

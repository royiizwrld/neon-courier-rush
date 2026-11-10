# 🏃‍♂️ Neon Courier Rush

Neon Courier Rush is a fast-paced, original 3D endless runner built entirely in code with procedural low-poly aesthetics, responsive multi-device controls, changing world biomes, and zero external 3D asset dependencies. Dash through neon skylines, misty ancient woods, toxic underground canals, crystal frost caverns, and glowing ember canyons while dodging hazards, grabbing power-ups, and warping across dimensions.

## Key Features

### Core 3D Gameplay & Fluid Movement
* **Original Runner Design:** Play as Vex, an agile courier rendered with dynamic articulated running animations, mid-air drops, grounded slide postures, and banked turns.
* **Three-Lane Precision:** Smooth eased lane changes, gravity-tuned jumps, low-friction slides, and fast-drop air stomps.
* **Fair Procedural Obstacles:** High-speed delivery vans, jumping barriers, duck signs, rolling boulders, falling icicles, and ground puddles generated through guaranteed-passable lane algorithms.
* **Coin Lines & Arc Formations:** Dynamic coin runs and mid-air arcs that reward sharp lane transitions and air maneuvers.

### Biomes & Dimensional Portals
* **5 Distinct Procedural Worlds:**
  * **Neon City:** Raining midnight skyscrapers, holographic billboards, and traffic streetlamps.
  * **Misty Forest:** Procedural low-poly pine trees, mossy boulders, fallen hurdle logs, and low-hanging tree branches.
  * **Toxic Sewers:** Industrial pipes, sludge hurdles, arched masonry, and sewer grates.
  * **Frost Caverns:** Crystalline ice pillars, stalactites, packed snowfields, and hanging icicle hazards.
  * **Ember Canyon:** Volcanic crags, scorched rock arches, glowing magma veins, and basalt towers.
* **Dimensional Warp Gates:** Glowing portal gateways appear every 400–700 meters with FOV stretching, camera warp flashes, safe transition coin lanes, and instant world shifts.

### Power-Ups & "Save Me" Economy
* **Dynamic Pickups:**
  * **Coin Magnet:** Draws nearby coins across all lanes for 10 seconds.
  * **2x Score Multiplier:** Doubles distance points and coin rewards for 12 seconds.
  * **Energy Shield:** Absorbs an accidental collision with recovery invulnerability.
  * **Rocket Jetpack:** Soars high above obstacles along an exclusive aerial coin path for 6 seconds.
* **Save Me Revive System:** Continue high-scoring runs with neon Gems (daily free revive, escalating costs of 2/4/8 gems, maximum 3 revives per run).
* **Gem Discovery:** Earn rare gems by discovering new portal biomes or hitting run milestones.

### 100% Procedural Web Audio Engine
* **Zero External Audio Files:** All sound effects and background music tracks are synthesized in real time using the native Web Audio API (oscillators, biquad filters, noise envelopes, and gain nodes).
* **Ascending Coin Chimes:** Pentatonic scale chimes that step up in pitch with consecutive coin pickups for satisfying streak feedback.
* **Biome-Adaptive Music:** Real-time step sequencer that automatically shifts tempo, basslines, and synth leads as you portal into new worlds (from 124 BPM cyberpunk synthwave to 116 BPM forest marimbas and 132 BPM canyon drives).
* **Instant Mute & Pause Sync:** Seamless one-tap audio muting (persisted across sessions) and audio-clock pausing when switching tabs or pausing gameplay.

### Responsive Multi-Device & PWA Ready
* **Dedicated Mobile Portrait View:** Custom camera pitch, wider vertical FOV, and scaled-down scene assets ensuring 3–4 obstacle rows remain clearly visible ahead on mobile screens.
* **Desktop & Ultrawide Layout:** Automatic side-scenery expansion to prevent empty letterboxes on ultrawide monitors, window resize stability, and non-scrolling key capture.
* **Full Controller Support:** Native Gamepad API integration for Xbox, PlayStation, and generic USB/Bluetooth controllers.
* **Installable Progressive Web App (PWA):** Standalone home screen launch, custom icons, service worker static asset caching, and offline play support.

### Engine Performance & Customization
* **Zero Allocation Render Loop:** Object pooling for track segments, scenery props, coins, and obstacles to prevent garbage collection frame drops.
* **Adaptive DPR & FPS Caps:** Dynamic resolution scaling, demand-driven frameloop driver, and configurable frame rate locks (30 FPS, 60 FPS, or uncapped).
* **Key Remapping & Settings:** Full keyboard bindings customization, UI scaling slider, haptic vibration toggles, and hidden debug performance HUD (F3 / triple tap).

## Controls Quick Reference

| Action | Touch / Mouse | Keyboard | Gamepad |
|---|---|---|---|
| Move Left / Right | Swipe Left / Right or Click-Drag | A / D or Left / Right Arrow | Left Stick / D-Pad |
| Jump | Swipe Up | W, Up Arrow, or Spacebar | A / Cross Button |
| Slide / Fast Drop | Swipe Down | S or Down Arrow | B / Circle Button |
| Pause Game | Tap Pause Button | P or Escape | Start / Menu Button |
| Mute Audio | Tap Speaker Icon | M | — |
| Toggle Fullscreen | Tap Maximize Icon | F | — |

## Tech Stack
* **Framework & Routing:** TanStack Start v1 & React 19 (full-stack SSR/SSG with edge-ready client architecture).
* **3D Graphics:** Three.js, @react-three/fiber, and @react-three/drei.
* **State Management:** Zustand for persistent player progress and decoupled 10Hz UI sync; custom mutable runtime for 60/120Hz physics loops.
* **Styling & UI:** Tailwind CSS v4, Lucide Icons, and semantic design tokens.
* **Audio Synthesis:** Native Web Audio API (real-time procedural sound generator & music sequencer).
* **PWA & Offline:** Web App Manifest, Service Worker caching, and LocalStorage persistence.

## License
Distributed under the MIT License. See LICENSE for more information.

Contact: royfrank028@gmail.com

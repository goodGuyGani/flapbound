# Flapbound

A hand-crafted Flappy Bird-style browser game. No build step, no external assets, no network calls - just open `index.html`.

## Play

Live: [goodguygani.github.io/flapbound](https://goodguygani.github.io/flapbound/)

- **Desktop:** click **Play**, then press **Space**, **W**, **ArrowUp**, or click the canvas to flap.
- **Mobile:** tap anywhere on the playfield to flap.
- **Pause:** `P` / `Esc`, or the pause button.
- **Restart:** `R` on the pause or game-over screen. A paused run banks its coins and stats before restarting.
- **Mute:** `M`.
- **Menus:** `Esc` closes the shop, goals, and settings screens.

## Features

- **Three modes** - Chill, Classic, and Chaos (moving gaps after a few points).
- **Bird shop** - seven skins with distinct colors and sparkle effects, bought with coins.
- **Three power-ups** - Shield absorbs one hit, Slow-Mo gives you time to line up, and Magnet pulls nearby coins toward you.
- **Perfect-pass combos** - fly through the middle of a gap to double your score for that pipe and earn bonus coins. A 5+ streak pays 2x coins and lights up the bird with a combo aura.
- **Close-call bonuses** - skim the edge of a gap for a bonus coin, a shimmer, and a brief cyan screen pulse.
- **12 goals** - lifetime and single-run challenges with automatic coin rewards and progress bars.
- **Settings** - separate effects and music volume sliders, vibration toggle, and screen-shake toggle. All settings persist.
- **Run stats** - pause to see score, best streak, close calls, and coins; the game-over screen adds perfect passes, streak, close calls, and flap count.
- **Coins, medals, and bests** - per-mode best, all-time best, run count, skins, goals, and stats all save locally in `localStorage`.
- **Synthesized audio** - sound effects and the generative music loop are made with the Web Audio API. Music gains a sparkle layer while a perfect streak is alive. Audio starts after your first tap or key press.
- **Hand-drawn canvas world** - parallax clouds, hills, birds, a day/night palette cycle, particles, screen shake, and confetti.
- **Responsive and accessible** - fills phones and desktops, honors reduced-motion preferences, includes a how-to-play section, and supports keyboard play.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Screens, HUD, and inline SVG artwork |
| `styles.css` | Layout, shop, goals, settings, overlays, and responsive styling |
| `game.js` | Game loop, physics, rendering, goals, settings, shop, and save data |
| `audio.js` | Web Audio sound effects and generative music |

Progress is stored under the key `flapbound.save.v1`. Clearing site data resets coins, skins, goals, and best scores.

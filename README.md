# Festive Fighter

Festive Fighter is a browser-based 2D fighting game set in a Diwali arena. Pick a fighter, build a loadout, and battle a CPU opponent. It is built with Phaser 4 and JavaScript; Vite serves the game.

## What you can do

- **Play solo against a bot.** Choose Easy, Normal, Hard, or Super Hard difficulty. The bot moves, attacks, throws fireworks, evades, and can parry when equipped.
- **Choose a fighter with a unique special.** Play as Olaal Babu, Laure, Royal, Harke, or Ballin. Their special moves include a spit attack, khukuri cut, rising palm, dirt toss, and a temporary melee damage boost.
- **Fight across a multi-level arena.** Move, jump, crouch, and use timed jabs and specials. Hits can land on the head, torso, or legs, with different damage by hit zone.
- **Use fireworks as weapons.** Sutli, Firecracker, Anar Rocket, and Chakri each have distinct projectile behavior. Firecracker can launch its user; Anar can be aimed with a trajectory preview before launch.
- **Parry projectiles.** Equip the Brass Puja Thali in the shop and time a parry to reflect an incoming projectile.
- **Unlock and equip items.** The shop offers fighters, fireworks, and parry gear. Your profile, purchases, and equipped weapon are saved in this browser.

## Start playing

Install [Node.js 24 or newer](https://nodejs.org/), then install dependencies and launch the web game:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (usually `http://localhost:5173`) in your browser. Enter a username to continue; it is a local display name and does not create an account. Choose **PLAY** for a bot match or use the shop to customize your loadout.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A / D or ← / → |
| Jump | W / Space / ↑ |
| Crouch | S / ↓ |
| Jab | J |
| Fighter special | E |
| Firework | F |
| Parry | R |
| Cancel Anar aim | Esc |
| Show collision overlay | F1 |

For Anar Rocket, hold **F**, aim with the mouse, then release **F** to fire. The on-screen combat HUD also displays action cooldowns and can be used to trigger the firework action.

## Project commands

```sh
npm run dev      # Start the Vite development server
npm run build    # Build the browser game
npm run preview  # Preview the production build
npm test         # Run the Node.js test suite
```

## Play Online

You can play the game directly in your web browser without downloading or installing anything.
https://festivefighter.netlify.app/
Simply open the link, wait for the game to load, and enjoy playing!

## Project layout

- `src/scenes/` — boot, menu, shop, and match scenes
- `src/entities/` — fighter behavior and bot AI
- `src/data/` — fighters, moves, weapons, abilities, and saved profile handling
- `shared/` — combat rules and projectile physics shared across the game
- `src/maps/` and `src/assets/` — arena layout and game artwork
- `docs/GAMEPLAY_GUIDE.md` — detailed gameplay and code guide

import Phaser from "phaser";

const THINK_INTERVAL = 110;
const ATTACK_DISTANCE = 108;
const KEEP_DISTANCE = 82;
const THROW_DISTANCE = 190;
const JUMP_COOLDOWN = 1150;

export default class BotAI {
  constructor(scene) {
    this.scene = scene;
    this.nextThinkAt = 0;
    this.specialReadyAt = 0;
    this.jumpReadyAt = 0;
  }

  update(time, dt) {
    const scene = this.scene;
    const bot = scene.dummyState;
    const player = scene.playerState;
    const fighter = scene.opponentFighter;

    if (
      scene.dummyHealth <= 0 ||
      scene.playerHealth <= 0
    ) {
      bot.vx = Phaser.Math.Linear(bot.vx, 0, Math.min(1, 7 * dt));
      if (bot.grounded && !fighter.isActing) {
        fighter.setPose("idle", 100);
      }
      return;
    }

    if (time < scene.dummyStunnedUntil) return;

    const dx = player.x - bot.x;
    const distance = Math.abs(dx);
    const towardPlayer = Math.sign(dx) || fighter.facing;

    if (!fighter.isActing) {
      fighter.setFacing(towardPlayer);
    }

    if (time >= this.nextThinkAt) {
      this.nextThinkAt = time + THINK_INTERVAL;
      this.decide(time, distance, towardPlayer);
    }

    this.move(time, dt, distance, towardPlayer);
  }

  decide(time, distance, towardPlayer) {
    const scene = this.scene;
    const bot = scene.dummyState;
    const fighter = scene.opponentFighter;
    const target = scene.playerFighter;
    const player = scene.playerState;

    if (this.evadeProjectile(time)) return;

    const incomingMove = target.currentMove;
    const incomingActive = target.isActing &&
      target.actionPhase === "active" &&
      distance < 155;

    if (
      incomingActive &&
      incomingMove?.targetZones.includes("legs") &&
      bot.grounded &&
      time >= this.jumpReadyAt
    ) {
      bot.vy = scene.jumpVelocity * 0.74;
      bot.grounded = false;
      this.jumpReadyAt = time + JUMP_COOLDOWN;
      fighter.setPose("jump", 65);
      return;
    }

    if (incomingActive && distance < 105) {
      bot.vx -= towardPlayer * 185;
      return;
    }

    if (fighter.isActing || !bot.grounded) return;

    const playerRecovering = target.isActing &&
      target.actionPhase === "recovery";
    const playerAirborne = !player.grounded;
    const playerCrouching = scene.isPlayerCrouching();

    if (
      playerCrouching &&
      player.grounded &&
      distance <= 114 &&
      distance > 45
    ) {
      scene.startBotAttack("sweep");
      return;
    }

    if (
      playerRecovering &&
      player.grounded &&
      distance > 105 &&
      distance < 220 &&
      time >= this.jumpReadyAt &&
      Math.random() < 0.45
    ) {
      bot.vy = scene.jumpVelocity * 0.82;
      bot.vx += towardPlayer * 170;
      bot.grounded = false;
      this.jumpReadyAt = time + JUMP_COOLDOWN;
      fighter.setPose("jump", 65);
      return;
    }

    if (
      distance > 125 &&
      distance < 310 &&
      (playerRecovering || playerAirborne) &&
      scene.startBotMobilityProjectile(towardPlayer)
    ) {
      return;
    }

    if (
      time >= this.specialReadyAt &&
      distance <= 103 &&
      distance >= 58 &&
      (playerRecovering || playerAirborne || distance > 98)
    ) {
      if (scene.startBotAttack("special")) {
        this.specialReadyAt = time + 3900;
        return;
      }
    }

    if (distance <= ATTACK_DISTANCE && distance > 42) {
      scene.startBotAttack(distance > 88 ? "kick" : "jab");
      return;
    }

    if (
      distance >= THROW_DISTANCE &&
      time >= scene.botThrowReadyAt &&
      scene.startBotProjectile()
    ) {
      scene.botThrowReadyAt = time + 3500;
    }
  }

  evadeProjectile(time) {
    const scene = this.scene;
    const bot = scene.dummyState;
    const fighter = scene.opponentFighter;

    if (fighter.isActing) return false;

    const threat = scene.projectiles
      .filter(projectile =>
        projectile.owner === "player" &&
        !projectile.detonated
      )
      .map(projectile => ({
        projectile,
        distance: Phaser.Math.Distance.Between(
          projectile.object.x,
          projectile.object.y,
          bot.x,
          bot.y - 90 * scene.fighterScale
        )
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!threat || threat.distance > threat.projectile.radius + 78) {
      return false;
    }

    const projectileInParryRange = scene.projectileTouchesFighter(
      threat.projectile.object.x,
      threat.projectile.object.y,
      fighter,
      12
    );

    if (
      scene.botParryTool &&
      time >= scene.botParryCooldownUntil &&
      !threat.projectile.botParryAttempted &&
      projectileInParryRange
    ) {
      threat.projectile.botParryAttempted = true;

      if (Math.random() < 0.5) {
        scene.botParryUntil = time + 260;
        scene.botParryCooldownUntil = time + 1000;
        fighter.setPose("parry", 60);
        scene.tryReflectProjectiles(time);

        if (scene.botParryUntil === 0) {
          return true;
        }
      }
    }

    const away = Math.sign(
      bot.x - threat.projectile.object.x
    ) || -fighter.facing;

    if (
      bot.grounded &&
      scene.startBotMobilityProjectile(away)
    ) {
      this.evadingUntil = time + 260;
      this.evadeDirection = away;
      return true;
    }

    this.evadeDirection = away;
    this.evadingUntil = time + 380;
    bot.vx += away * 210;

    if (
      bot.grounded &&
      time >= this.jumpReadyAt &&
      threat.distance < threat.projectile.radius + 35
    ) {
      bot.vy = scene.jumpVelocity * 0.65;
      bot.grounded = false;
      this.jumpReadyAt = time + JUMP_COOLDOWN;
      fighter.setPose("jump", 70);
    }

    return true;
  }

  move(time, dt, distance, towardPlayer) {
    const scene = this.scene;
    const bot = scene.dummyState;
    const fighter = scene.opponentFighter;

    if (fighter.isActing) return;

    if (time < scene.botThrowPoseUntil) {
      bot.vx = Phaser.Math.Linear(bot.vx, 0, Math.min(1, 8 * dt));
      return;
    }

    if (time < this.evadingUntil) {
      bot.vx = Phaser.Math.Linear(
        bot.vx,
        this.evadeDirection * 190,
        Math.min(1, 8 * dt)
      );

      if (bot.grounded) {
        fighter.setPose("walk", 100);
      }

      return;
    }

    const target = scene.playerFighter;
    const incomingActive = target.isActing &&
      target.actionPhase === "active" &&
      distance < 110;

    let direction = 0;

    if (incomingActive) {
      direction = -towardPlayer;
    } else if (distance > KEEP_DISTANCE + 24) {
      direction = towardPlayer;
    } else if (distance < KEEP_DISTANCE - 22) {
      direction = -towardPlayer;
    }

    const targetSpeed = direction * (incomingActive ? 260 : 240);
    bot.vx = Phaser.Math.Linear(
      bot.vx,
      targetSpeed,
      Math.min(1, 10 * dt)
    );

    if (bot.grounded) {
      fighter.setPose(direction === 0 ? "idle" : "walk", 130);
    }
  }
}

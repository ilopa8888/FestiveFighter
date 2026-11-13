
import Phaser from "phaser";
import idleSpriteSheetUrl from "../assets/sprites/Idle.png";
import walkingSpriteSheetUrl from "../assets/sprites/Walking.png";
import spittingSpriteSheetUrl from "../assets/sprites/Spitting.png";
import rocketBigSpriteUrl from "../assets/sprites/firework-rocket-big.png";
import explosionSpriteSheetUrl from "../assets/sprites/explosion.png";

export default class MatchScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MatchScene",
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            }
        });
    }

    init(data) {
        this.username = data?.username?.trim() || "Player";
    }

    preload() {
        this.load.spritesheet("rover_idle", idleSpriteSheetUrl, {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet("rover_walking", walkingSpriteSheetUrl, {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet("rover_spitting", spittingSpriteSheetUrl, {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet("rocket_explosion", explosionSpriteSheetUrl, {
            frameWidth: 100,
            frameHeight: 100
        });
        this.load.image("diwali_rocket_big", rocketBigSpriteUrl);
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, "arena_background")
            .setDisplaySize(width, height);

        this.anims.create({
            key: "rover_idle_animation",
            frames: this.anims.generateFrameNumbers("rover_idle", { start: 0, end: 11 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: "rover_walking_animation",
            frames: this.anims.generateFrameNumbers("rover_walking", { start: 0, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "rover_spitting_animation",
            frames: this.anims.generateFrameNumbers("rover_spitting", { start: 0, end: 11 }),
            frameRate: 10,
            repeat: 0
        });
        this.anims.create({
            key: "rocket_explosion_animation",
            frames: this.anims.generateFrameNumbers("rocket_explosion", { start: 0, end: 69 }),
            frameRate: 24,
            repeat: 0
        });
        const arenaFloorY = height * (530 / 576);
        // Physics proxy aligned with the arena's visible bottom platform.
        this.bottomPlatform = this.add.zone(width / 2, arenaFloorY, width, 8);
        this.physics.add.existing(this.bottomPlatform, true);
        const characterScale = (142 / 34) * (height / 576);
        this.characterScale = characterScale;
        this.character = this.add.sprite(width / 2, arenaFloorY, "rover_idle", 0)
            .setOrigin(0.5, 1)
            .setScale(characterScale)
            .setDepth(1)
            .play("rover_idle_animation");
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spitKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.rocketKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.mouse.disableContextMenu();
        this.rocketAimGraphics = this.add.graphics().setDepth(3).setVisible(false);
        this.rockets = [];
        this.rocketGravity = 700;
        this.rocketMaxAimDistance = width / 3;
        this.rocketFlightDuration = 2500;
        this.rocketCooldownDuration = 3000;
        this.rocketCooldownActive = false;
        this.rocketCooldownTimer = null;
        this.rocketCooldownEndsAt = 0;
        this.rocketDisplaySize = 75;
        // The artwork's nose points up and to the right at roughly 45 degrees.
        this.rocketSpriteForwardAngle = -Math.PI / 4;
        this.isAttacking = false;
        this.character.on("animationcomplete-rover_spitting_animation", () => {
            this.isAttacking = false;
            this.character.setTexture("rover_idle", 0)
                .setOrigin(0.5, 1)
                .setScale(characterScale);
            this.resumeMovementAnimation();
        });
        this.movementSpeed = 300;
        this.arenaWidth = width;

        this.rocketCooldownPanel = this.add.rectangle(0, 0, 148, 52, 0x10251d, 0.9)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x4ade80, 0.45);
        this.rocketCooldownIcon = this.add.image(8, 8, "diwali_rocket_big")
            .setOrigin(0, 0)
            .setDisplaySize(36, 36);
        this.rocketCooldownLabelText = this.add.text(52, 7, "ROCKET", {
            fontSize: "11px",
            fontStyle: "bold",
            color: "#f8fafc"
        }).setOrigin(0, 0);
        this.rocketCooldownStateText = this.add.text(52, 24, "READY", {
            fontSize: "15px",
            fontStyle: "bold",
            color: "#86efac"
        }).setOrigin(0, 0);
        this.rocketCooldownHud = this.add.container(12, 12, [
            this.rocketCooldownPanel,
            this.rocketCooldownIcon,
            this.rocketCooldownLabelText,
            this.rocketCooldownStateText
        ]).setScrollFactor(0).setDepth(10);
        this.events.once("shutdown", this.clearRocketCooldown, this);

        this.add.text(width / 2, 24, `Fighting as ${this.username}`, {
            fontSize: "24px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#111827",
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 0);
    }

    update(time, delta) {
        const rocketPressed = Phaser.Input.Keyboard.JustDown(this.rocketKey);
        if (this.isAimingRocket) {
            if (this.rocketKey.isDown) {
                this.updateRocketAim();
            } else {
                this.isAimingRocket = false;
                this.rocketAimGraphics.clear().setVisible(false);
                this.launchRocket();
            }
        } else if (rocketPressed && !this.rocketCooldownActive) {
            this.isAimingRocket = true;
            this.updateRocketAim();
        }

        if (Phaser.Input.Keyboard.JustDown(this.spitKey) && !this.isAttacking) {
            this.handleSpitInput();
        }

        const movingLeft = this.cursors.left.isDown;
        const movingRight = this.cursors.right.isDown;
        const direction = Number(movingRight) - Number(movingLeft);

        if (direction !== 0) {
            this.character.x += direction * this.movementSpeed * (delta / 1000);
            if (!this.isAttacking) {
                this.character.setFlipX(direction < 0);
            }
        }

        const halfCharacterWidth = this.character.displayWidth / 2;
        this.character.x = Phaser.Math.Clamp(
            this.character.x,
            halfCharacterWidth,
            this.arenaWidth - halfCharacterWidth
        );

        if (!this.isAttacking) {
            this.resumeMovementAnimation(direction);
        }

        this.updateRocketCooldownDisplay();

        this.rockets = this.rockets.filter((rocket) => {
            if (!rocket.active) return false;
            const body = rocket.body;
            if (body) {
                rocket.setRotation(
                    Math.atan2(body.velocity.y, body.velocity.x) - this.rocketSpriteForwardAngle
                );
            }
            const rangeReached = Math.abs(rocket.x - rocket.launchOriginX) >= rocket.maxRange;
            if (rangeReached || rocket.y > this.scale.height + 100 ||
                rocket.x < -100 || rocket.x > this.scale.width + 100) {
                this.explodeRocket(rocket);
                return false;
            }
            return true;
        });
    }

    updateRocketAim() {
        const pointer = this.input.activePointer;
        const originX = this.character.x;
        const originY = this.character.y - this.character.displayHeight * 0.55;
        const dx = pointer.worldX - originX;
        const dy = pointer.worldY - originY;
        const distance = Math.hypot(dx, dy) || 1;
        const aimDistance = Math.min(distance, this.rocketMaxAimDistance);
        const directionX = dx / distance;
        const directionY = dy / distance;
        const targetX = originX + directionX * aimDistance;
        const targetY = originY + directionY * aimDistance;
        const speed = 350 + (aimDistance / this.rocketMaxAimDistance) * 250;
        const velocityX = directionX * speed;
        const velocityY = directionY * speed;

        this.currentRocketShot = { originX, originY, velocityX, velocityY };
        const graphics = this.rocketAimGraphics;
        graphics.clear().setVisible(true);
        graphics.lineStyle(2, 0xffd166, 0.75);
        graphics.lineBetween(originX, originY, targetX, targetY);
        graphics.fillStyle(0xffd166, 0.95).fillCircle(targetX, targetY, 5);

        graphics.lineStyle(2, 0xffd166, 0.5);
        graphics.beginPath();
        graphics.moveTo(originX, originY);
        const step = 0.06;
        for (let t = step; t <= 1.2; t += step) {
            const x = originX + velocityX * t;
            const y = originY + velocityY * t + 0.5 * this.rocketGravity * t * t;
            graphics.lineTo(x, y);
            if (x < 0 || x > this.scale.width || y > this.scale.height) break;
        }
        graphics.strokePath();
    }

    launchRocket() {
        const shot = this.currentRocketShot;
        this.currentRocketShot = null;
        if (!shot || this.rocketCooldownActive) return;

        const rocket = this.physics.add.image(shot.originX, shot.originY, "diwali_rocket_big");
        rocket.setOrigin(0.5, 0.5)
            .setDisplaySize(this.rocketDisplaySize, this.rocketDisplaySize)
            .setDepth(2);
        rocket.body.setAllowGravity(true);
        rocket.body.setGravityY(this.rocketGravity);
        rocket.setVelocity(shot.velocityX, shot.velocityY);
        rocket.setRotation(
            Math.atan2(shot.velocityY, shot.velocityX) - this.rocketSpriteForwardAngle
        );
        rocket.launchOriginX = shot.originX;
        rocket.maxRange = this.rocketMaxAimDistance;
        rocket.platformCollider = this.physics.add.collider(
            rocket,
            this.bottomPlatform,
            () => this.explodeRocket(rocket)
        );
        this.rockets.push(rocket);
    
        rocket.flightTimer = this.time.delayedCall(
            this.rocketFlightDuration,
            () => this.explodeRocket(rocket)
        );
        this.startRocketCooldown();
    }

    startRocketCooldown() {
        if (this.rocketCooldownTimer) {
            this.rocketCooldownTimer.remove(false);
        }

        this.rocketCooldownActive = true;
        this.rocketCooldownEndsAt = this.time.now + this.rocketCooldownDuration;
        this.rocketCooldownTimer = this.time.delayedCall(this.rocketCooldownDuration, () => {
            this.rocketCooldownTimer = null;
            this.rocketCooldownActive = false;
            this.rocketCooldownEndsAt = 0;
        });
    }

    updateRocketCooldownDisplay() {
        if (!this.rocketCooldownStateText) return;

        if (this.rocketCooldownActive) {
            const secondsLeft = Math.max(
                1,
                Math.ceil((this.rocketCooldownEndsAt - this.time.now) / 1000)
            );
            this.rocketCooldownStateText.setText(`${secondsLeft}s`).setColor("#fcd34d");
            this.rocketCooldownPanel
                .setFillStyle(0x292315, 0.9)
                .setStrokeStyle(1, 0xfbbf24, 0.5);
        } else {
            this.rocketCooldownStateText.setText("READY").setColor("#86efac");
            this.rocketCooldownPanel
                .setFillStyle(0x10251d, 0.9)
                .setStrokeStyle(1, 0x4ade80, 0.45);
        }
    }

    clearRocketCooldown() {
        if (this.rocketCooldownTimer) {
            this.rocketCooldownTimer.remove(false);
            this.rocketCooldownTimer = null;
        }
        this.rocketCooldownActive = false;
        this.rocketCooldownEndsAt = 0;
    }

    explodeRocket(rocket) {
        if (!rocket || rocket.isBeingDestroyed) return;

        const explosionX = rocket.x;
        const explosionY = rocket.y;
        if (!this.destroyRocket(rocket)) return;

        const explosion = this.add.sprite(explosionX, explosionY, "rocket_explosion")
            .setOrigin(0.5, 0.5)
            .setDepth(2);
        explosion.once("animationcomplete", () => explosion.destroy());
        explosion.play("rocket_explosion_animation");
    }

    destroyRocket(rocket) {
        if (!rocket || rocket.isBeingDestroyed) return false;
        rocket.isBeingDestroyed = true;

        rocket.body?.stop();
        if (rocket.flightTimer) {
            rocket.flightTimer.remove(false);
            rocket.flightTimer = null;
        }
        if (rocket.platformCollider) {
            this.physics.world.removeCollider(rocket.platformCollider);
            rocket.platformCollider = null;
        }
        rocket.destroy();
        this.rockets = this.rockets.filter((activeRocket) => activeRocket !== rocket);
        return true;
    }

    handleSpitInput() {
        if (this.isAttacking) {
            return;
        }

        this.isAttacking = true;
        this.character.setTexture("rover_spitting", 0)
            .setOrigin(0.5, 1)
            .setScale(this.characterScale);
        this.character.play("rover_spitting_animation");
    }

    resumeMovementAnimation(direction = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown)) {
        const animationKey = direction === 0
            ? "rover_idle_animation"
            : "rover_walking_animation";
        if (this.character.anims.currentAnim?.key !== animationKey) {
            this.character.play(animationKey);
        } else {
            this.character.anims.resume();
        }
    }
}


import Phaser from "phaser";
import idleSpriteSheetUrl from "../assets/sprites/IDLE.png";
import runSpriteSheetUrl from "../assets/sprites/RUN.png";

export default class MatchScene extends Phaser.Scene {
    constructor() {
        super("MatchScene");
    }

    init(data) {
        this.username = data?.username?.trim() || "Player";
    }

    preload() {
        this.load.spritesheet("rover_idle", idleSpriteSheetUrl, {
            frameWidth: 96,
            frameHeight: 96
        });
        this.load.spritesheet("rover_run", runSpriteSheetUrl, {
            frameWidth: 96,
            frameHeight: 96
        });
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, "arena_background")
            .setDisplaySize(width, height);

        this.anims.create({
            key: "rover_idle_animation",
            frames: this.anims.generateFrameNumbers("rover_idle", { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: "rover_run_animation",
            frames: this.anims.generateFrameNumbers("rover_run", { start: 0, end: 15 }),
            frameRate: 12,
            repeat: -1
        });

        const arenaFloorY = height * (530 / 576);
        const characterScale = (142 / 34) * (height / 576);
        this.character = this.add.sprite(width / 2, arenaFloorY, "rover_idle", 0)
            .setOrigin(0.5, 80 / 96)
            .setScale(characterScale)
            .setDepth(1)
            .play("rover_idle_animation");

        this.cursors = this.input.keyboard.createCursorKeys();
        this.movementSpeed = 300;
        this.arenaWidth = width;

        this.add.text(width / 2, 24, `Fighting as ${this.username}`, {
            fontSize: "24px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#111827",
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 0);
    }

    update(time, delta) {
        const movingLeft = this.cursors.left.isDown;
        const movingRight = this.cursors.right.isDown;
        const direction = Number(movingRight) - Number(movingLeft);

        if (direction !== 0) {
            this.character.x += direction * this.movementSpeed * (delta / 1000);
            this.character.setFlipX(direction < 0);
        }

        const halfCharacterWidth = this.character.displayWidth / 2;
        this.character.x = Phaser.Math.Clamp(
            this.character.x,
            halfCharacterWidth,
            this.arenaWidth - halfCharacterWidth
        );

        const animationKey = direction === 0
            ? "rover_idle_animation"
            : "rover_run_animation";
        if (this.character.anims.currentAnim?.key !== animationKey) {
            this.character.play(animationKey);
        }
    }
}

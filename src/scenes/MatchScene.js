
import Phaser from "phaser";
import idleSpriteSheetUrl from "../assets/sprites/Idle.png";
import walkingSpriteSheetUrl from "../assets/sprites/Walking.png";
import spittingSpriteSheetUrl from "../assets/sprites/Spitting.png";

export default class MatchScene extends Phaser.Scene {
    constructor() {
        super("MatchScene");
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
        const arenaFloorY = height * (530 / 576);
        const characterScale = (142 / 34) * (height / 576);
        this.characterScale = characterScale;
        this.character = this.add.sprite(width / 2, arenaFloorY, "rover_idle", 0)
            .setOrigin(0.5, 1)
            .setScale(characterScale)
            .setDepth(1)
            .play("rover_idle_animation");
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spitKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
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

        this.add.text(width / 2, 24, `Fighting as ${this.username}`, {
            fontSize: "24px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#111827",
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 0);
    }

    update(time, delta) {
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

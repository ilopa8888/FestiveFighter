
import Phaser from "phaser";
import idleSpriteSheetUrl from "../assets/sprites/IDLE.png";

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

        const arenaFloorY = height * (530 / 576);
        // The artwork occupies about 34px vertically inside each 96px frame.
        // Scale to the previous character's 142px visual height, and anchor
        // the artwork's bottom row (y=80) to the existing platform surface.
        const characterScale = (142 / 34) * (height / 576);
        this.add.sprite(width / 2, arenaFloorY, "rover_idle", 0)
            .setOrigin(0.5, 80 / 96)
            .setScale(characterScale)
            .setDepth(1)
            .play("rover_idle_animation");

        this.add.text(width / 2, 24, `Fighting as ${this.username}`, {
            fontSize: "24px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#111827",
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 0);
    }
}

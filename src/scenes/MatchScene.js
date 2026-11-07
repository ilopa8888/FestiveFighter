
import Phaser from "phaser";

export default class MatchScene extends Phaser.Scene {
    constructor() {
        super("MatchScene");
    }

    init(data) {
        this.username = data?.username?.trim() || "Player";
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, "arena_background")
            .setDisplaySize(width, height);

        this.add.text(width / 2, 24, `Fighting as ${this.username}`, {
            fontSize: "24px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#111827",
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 0);
    }
}

import Phaser from "phaser";

class FightScene extends Phaser.Scene {
  constructor() {
    super("FightScene");
  }

  create() {
    const { width, height } = this.scale;

    // Title Text
    this.add.text(width / 2, 80, "FESTIVE FIGHTER", {
      fontSize: "36px",
      color: "#ffc107",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, "Fight Starts!", {
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Fullscreen / Lock Orientation Button
    const fsButton = this.add.text(width - 20, 20, "[ ⛶ Fullscreen ]", {
      fontSize: "18px",
      color: "#00e676",
      backgroundColor: "#111827",
      padding: { x: 10, y: 5 }
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });

    fsButton.on("pointerdown", async () => {
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
        
        // Attempt landscape lock for mobile / tablet screens
        try {
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock("landscape");
          }
        } catch (err) {
          console.log("Orientation lock not supported on desktop monitors.");
        }
      } else {
        this.scale.stopFullscreen();
      }
    });

    // Update button text on fullscreen state change
    this.scale.on("enterfullscreen", () => {
      fsButton.setText("[ ✖ Exit Fullscreen ]");
    });

    this.scale.on("leavefullscreen", () => {
      fsButton.setText("[ ⛶ Fullscreen ]");
    });
  }

  update() {}
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: "#170d2b",
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  scene: [FightScene]
};

new Phaser.Game(config);
import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/menuScene.js";
import MatchScene from "./scenes/MatchScene.js";

class FightScene extends Phaser.Scene {
  constructor() {
    super("FightScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, 80, "FESTIVE FIGHTER", {
      fontSize: "36px",
      color: "#ffc107",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, "Fight Starts!", {
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

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

        try {
          if (screen.orientation?.lock) {
            await screen.orientation.lock("landscape");
          }
        } catch (err) {
          console.log("Orientation lock is not supported here.");
        }
      } else {
        this.scale.stopFullscreen();
      }
    });

    this.scale.on("enterfullscreen", () => {
      fsButton.setText("[ ✖ Exit Fullscreen ]");
    });

    this.scale.on("leavefullscreen", () => {
      fsButton.setText("[ ⛶ Fullscreen ]");
    });
  }
}

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#170d2b",
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MenuScene, FightScene, MatchScene]
};

new Phaser.Game(config);

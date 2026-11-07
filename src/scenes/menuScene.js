import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width * 0.9, 440);
    const panelHeight = 250;
    const inputWidth = Math.min(panelWidth - 48, 360);
    const inputHeight = 48;

    const background = this.add.image(centerX, centerY, "login_arena");
    this.fitBackground(background, width, height);
    //-----GrayBox-----
    this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x111827, 0.82);

    this.add.text(centerX, centerY - 62, "Enter your username", {
      fontSize: "20px",
      color: "#ffffff"
    }).setOrigin(0.5);

 
    this.usernameInput = this.add.dom(centerX, centerY - 8)
      .createElement("div", {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${inputWidth}px`,
        height: `${inputHeight}px`
      })
      .setOrigin(0.5, 0.5);

    this.usernameField = document.createElement("input");
    this.usernameField.type = "text";
    this.usernameField.maxLength = 20;
    this.usernameField.autocomplete = "username";
    this.usernameField.setAttribute("aria-label", "Username");

    Object.assign(this.usernameField.style, {
      boxSizing: "border-box",
      display: "block",
      width: "100%",
      height: "100%",
      padding: "8px 12px",
      border: "2px solid #ffc107",
      borderRadius: "6px",
      background: "#ffffff",
      color: "#111827",
      fontSize: "18px",
      textAlign: "center",
      outline: "none"
    });

    this.usernameInput.node.appendChild(this.usernameField);

    this.errorText = this.add.text(centerX, centerY + 34, "", {
      fontSize: "16px",
      color: "#ff8080"
    }).setOrigin(0.5);

    const startButton = this.add.text(centerX, centerY + 82, "START FIGHT", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#111827",
      backgroundColor: "#ffc107",
      padding: { x: 24, y: 14 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => this.startFight());
    this.usernameField.addEventListener("keydown", event => {
      if (event.key === "Enter") this.startFight();
    });

    this.usernameField.focus();
  }

  fitBackground(background, width, height) {
    const source = this.textures.get("login_arena").getSourceImage();
    const scale = Math.max(width / source.width, height / source.height);

    background.setPosition(width / 2, height / 2).setScale(scale);
  }

  startFight() {
    const username = this.usernameField.value.trim();

    if (!username) {
      this.errorText.setText("Please enter a username.");
      this.usernameField.focus();
      return;
    }

    this.scene.start("MatchScene", { username });
  }
}
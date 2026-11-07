
import Phaser from "phaser";

// =============================================
// POSES
// All angles are relative to the body joints.
// =============================================

const POSES = {
  idle: {
    torso: 0,
    armLU: 45, armLL: -20,
    armRU: -45, armRL: 20,
    legLU: 8, legLL: 0,
    legRU: -8, legRL: 0
  },

  walk: {
    torso: 0,
    armLU: 25, armLL: -10,
    armRU: -25, armRL: 10,
    legLU: -22, legLL: 12,
    legRU: 22, legRL: -12
  },

  guard: {
    torso: -4,
    armLU: 35, armLL: -100,
    armRU: -35, armRL: 100,
    legLU: 8, legLL: 0,
    legRU: -8, legRL: 0
  },

  crouch: {
    torso: 12,
    armLU: 45, armLL: -80,
    armRU: -45, armRL: 80,
    legLU: 25, legLL: -40,
    legRU: -25, legRL: 40
  },

  jump: {
    torso: -8,
    armLU: 60, armLL: -70,
    armRU: -60, armRL: 70,
    legLU: 32, legLL: -55,
    legRU: -32, legRL: 55
  },

  jab: {
    torso: -4,
    armLU: 40, armLL: -100,
    armRU: -90, armRL: 0,
    legLU: 8, legLL: 0,
    legRU: -8, legRL: 0
  },

  kick: {
    torso: -8,
    armLU: 45, armLL: -70,
    armRU: -45, armRL: 70,
    legLU: 8, legLL: 0,
    legRU: -72, legRL: 15
  },

  sweep: {
    torso: 13,
    armLU: 50, armLL: -80,
    armRU: -35, armRL: 70,
    legLU: 14, legLL: -20,
    legRU: -100, legRL: 55
  },

  uppercut: {
    torso: -16,
    armLU: 45, armLL: -100,
    armRU: -150, armRL: 40,
    legLU: 15, legLL: -10,
    legRU: -15, legRL: 10
  },

  shadowSweep: {
    torso: 12,
    armLU: 50, armLL: -90,
    armRU: -40, armRL: 75,
    legLU: 13, legLL: -15,
    legRU: -105, legRL: 50
  },

  parry: {
    torso: -4,
    armLU: 0, armLL: -45,
    armRU: -55, armRL: -85,
    legLU: 8, legLL: 0,
    legRU: -8, legRL: 0
  },

  throw: {
    torso: -8,
    armLU: 45, armLL: -70,
    armRU: -95, armRL: 10,
    legLU: 10, legLL: 0,
    legRU: -10, legRL: 0
  },

  hit: {
    torso: 16,
    armLU: 90, armLL: 30,
    armRU: -90, armRL: -30,
    legLU: 18, legLL: -8,
    legRU: -18, legRL: 8
  }
};


// =============================================
// MOVE DATABASE
// hitbox offsets are relative to fighter feet.
// =============================================

const MOVES = {
  jab: {
    name: "QUICK JAB",
    pose: "jab",
    windup: 65,
    active: 110,
    recovery: 155,
    damage: 6,
    knockback: 115,
    lift: 20,
    targetZones: ["head", "torso"],
    hitbox: { x: 55, y: -99, width: 58, height: 34 }
  },

  kick: {
    name: "FRONT KICK",
    pose: "kick",
    windup: 105,
    active: 120,
    recovery: 210,
    damage: 12,
    knockback: 200,
    lift: 190,
    targetZones: ["torso", "legs"],
    hitbox: { x: 75, y: -66, width: 92, height: 55 }
  },

  sweep: {
    name: "LOW SWEEP",
    pose: "sweep",
    windup: 90,
    active: 140,
    recovery: 240,
    damage: 13,
    knockback: 180,
    lift: 25,
    targetZones: ["legs"],
    hitbox: { x: 70, y: -25, width: 100, height: 29 }
  }
};


// =============================================
// CHARACTER SPECIAL MOVES
// =============================================

const SPECIAL_MOVES = {
  sunfire: {
    name: "AGNI UPPERCUT",
    pose: "uppercut",
    windup: 145,
    active: 135,
    recovery: 320,
    damage: 26,
    knockback: 440,
    lift: 220,
    targetZones: ["head", "torso"],
    hitbox: { x: 65, y: -119, width: 80, height: 85 },
    effectColor: 0xff7625
  },

  shadow: {
    name: "SHADOW SWEEP",
    pose: "shadowSweep",
    windup: 100,
    active: 140,
    recovery: 290,
    damage: 21,
    knockback: 360,
    lift: 55,
    targetZones: ["torso", "legs"],
    hitbox: { x: 80, y: -39, width: 105, height: 46 },
    effectColor: 0x9b59dc
  }
};


export default class PolygonFighter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, character, weapon = null, parryTool = null) {
    super(scene, x, y);

    this.sceneRef = scene;
    this.character = character;
    this.weapon = weapon;
    this.parryTool = parryTool;

    this.parts = {};
    this.facing = 1;
    this.currentPose = null;
    this.isActing = false;
    this.actionToken = 0;
    this.currentMove = null;
    this.actionPhase = null;

    scene.add.existing(this);

    this.createRig();
    this.drawEquipment();
    this.setPose("idle", 0);
  }

  // ===========================================
  // RIG
  // ===========================================

  createRig() {
    const c = this.character.colors;

    // Torso
    const torso = this.sceneRef.add.container(0, -95);
    this.add(torso);

    this.parts.torso = torso;

    const body = this.sceneRef.add.graphics();

    body.fillStyle(c.body);

    body.fillPoints([
      { x: -17, y: -31 },
      { x: 17, y: -31 },
      { x: 22, y: 13 },
      { x: 12, y: 34 },
      { x: -12, y: 34 },
      { x: -22, y: 13 }
    ], true);

    body.lineStyle(2, c.dark);
    body.strokePoints([
      { x: -17, y: -31 },
      { x: 17, y: -31 },
      { x: 22, y: 13 },
      { x: 12, y: 34 },
      { x: -12, y: 34 },
      { x: -22, y: 13 }
    ], true);

    body.fillStyle(c.dark);
    body.fillRect(-15, 23, 30, 6);

    body.fillStyle(c.skin);
    body.fillRect(-6, -44, 12, 15);
    body.fillCircle(0, -58, 16);

    // Hair
    body.fillStyle(c.hair);
    body.fillPoints([
      { x: -15, y: -60 },
      { x: -13, y: -74 },
      { x: -4, y: -80 },
      { x: 9, y: -75 },
      { x: 16, y: -60 },
      { x: 5, y: -65 },
      { x: -6, y: -65 }
    ], true);

    // Eyes
    body.fillStyle(0x171717);
    body.fillCircle(-6, -58, 1.8);
    body.fillCircle(6, -58, 1.8);

    torso.add(body);

    // Arms
    this.parts.armL = this.createLimb(
      -16, -120, 23, 21,
      c.skin, c.gloves, "arm"
    );

    this.parts.armR = this.createLimb(
      16, -120, 23, 21,
      c.skin, c.gloves, "arm"
    );

    // Legs
    this.parts.legL = this.createLimb(
      -10, -62, 29, 29,
      c.skin, c.dark, "leg"
    );

    this.parts.legR = this.createLimb(
      10, -62, 29, 29,
      c.skin, c.dark, "leg"
    );

    this.specialEffect = this.sceneRef.add.graphics();
    this.add(this.specialEffect);
  }

  createLimb(x, y, upperLength, lowerLength, skin, accent, type) {
    const upper = this.sceneRef.add.container(x, y);
    this.add(upper);

    this.drawSegment(
      upper,
      upperLength,
      type === "arm" ? 10 : 12,
      skin,
      accent
    );

    const lower = this.sceneRef.add.container(0, upperLength);
    upper.add(lower);

    this.drawSegment(
      lower,
      lowerLength,
      type === "arm" ? 8 : 10,
      skin,
      accent
    );

    const hand = this.sceneRef.add.container(0, lowerLength);
    lower.add(hand);

    const detail = this.sceneRef.add.graphics();

    if (type === "arm") {
      detail.fillStyle(accent);
      detail.fillRoundedRect(-6, -7, 17, 14, 5);
      detail.lineStyle(1, 0xffffff, 0.25);
      detail.strokeRoundedRect(-6, -7, 17, 14, 5);
    } else {
      detail.fillStyle(accent);
      detail.fillPoints([
        { x: -6, y: -5 },
        { x: 8, y: -5 },
        { x: 15, y: 3 },
        { x: -7, y: 3 }
      ], true);
    }

    hand.add(detail);

    return { upper, lower, hand };
  }

  drawSegment(parent, length, thickness, color, accent) {
    const g = this.sceneRef.add.graphics();

    g.fillStyle(color);

    g.fillPoints([
      { x: -thickness / 2, y: 0 },
      { x: thickness / 2, y: 0 },
      { x: thickness / 2, y: length - 4 },
      { x: 0, y: length },
      { x: -thickness / 2, y: length - 4 }
    ], true);

    g.lineStyle(1, accent, 0.55);

    g.strokePoints([
      { x: -thickness / 2, y: 0 },
      { x: thickness / 2, y: 0 },
      { x: thickness / 2, y: length - 4 },
      { x: 0, y: length },
      { x: -thickness / 2, y: length - 4 }
    ], true);

    parent.add(g);
  }

  // ===========================================
  // FACING
  // ===========================================

  setFacing(direction) {
    this.facing = direction < 0 ? -1 : 1;

    const sx = Math.abs(this.scaleX || 1);
    const sy = Math.abs(this.scaleY || 1);

    this.setScale(this.facing * sx, sy);
  }

  // ===========================================
  // CHARACTER / EQUIPMENT
  // ===========================================

  
  setCharacter(character) {
    // Stop only this fighter's animations.
    const targets = [
      this.parts.torso,
      this.parts.armL?.upper,
      this.parts.armL?.lower,
      this.parts.armL?.hand,
      this.parts.armR?.upper,
      this.parts.armR?.lower,
      this.parts.armR?.hand,
      this.parts.legL?.upper,
      this.parts.legL?.lower,
      this.parts.legL?.hand,
      this.parts.legR?.upper,
      this.parts.legR?.lower,
      this.parts.legR?.hand,
      this.specialEffect
    ];

    targets.forEach(target => {
      if (target) {
        this.sceneRef.tweens.killTweensOf(target);
      }
    });

    this.removeAll(true);

    this.character = character;
    this.parts = {};
    this.currentPose = null;
    this.specialEffect = null;

    this.createRig();
    this.drawEquipment();
    this.setPose("idle", 0);
  }


  equip(weapon, parryTool) {
    this.weapon = weapon;
    this.parryTool = parryTool;
    this.drawEquipment();
  }

  drawEquipment() {
    this.weaponGraphic?.destroy();
    this.parryGraphic?.destroy();

    // Right hand: equipped weapon
    const rightHand = this.parts.armR.hand;

    this.weaponGraphic = this.sceneRef.add.graphics();
    rightHand.add(this.weaponGraphic);

    const w = this.weaponGraphic;

    if (this.weapon?.id === "sutli") {
      w.fillStyle(0x9a3412);
      w.fillRoundedRect(3, -13, 16, 26, 4);

      w.fillStyle(0xfbbf24);
      w.fillRect(4, -12, 14, 4);

      w.lineStyle(2, 0xffe4a1);
      w.lineBetween(12, -14, 18, -22);
    }

    if (this.weapon?.id === "firecracker") {
      w.fillStyle(0xef4444);
      w.fillRoundedRect(3, -10, 23, 12, 4);

      w.fillStyle(0xffd166);
      w.fillRect(6, -8, 16, 3);

      w.lineStyle(2, 0xffe4a1);
      w.lineBetween(24, -10, 29, -18);
    }

    if (this.weapon?.id === "anar") {
      w.fillStyle(0xd62839);
      w.fillRoundedRect(4, -15, 13, 27, 5);
      w.fillStyle(0xffd166);
      w.fillRect(6, -12, 9, 4);
      w.lineStyle(2, 0xffe4a1);
      w.lineBetween(10, -15, 16, -23);
    }

    if (this.weapon?.id === "chakri") {
      w.lineStyle(4, 0x54d8cb);
      w.strokeCircle(13, -2, 10);
      w.lineStyle(2, 0xffe4a1);
      w.lineBetween(18, -10, 22, -17);
    }

    // Left hand: brass puja thali
    const leftHand = this.parts.armL.hand;

    this.parryGraphic = this.sceneRef.add.graphics();
    leftHand.add(this.parryGraphic);

    if (this.parryTool?.id === "puja-thali") {
      const p = this.parryGraphic;

      p.fillStyle(0x986022);
      p.fillCircle(7, 0, 16);

      p.fillStyle(0xd6a747);
      p.fillCircle(7, 0, 13);

      p.lineStyle(2, 0xffe7a5);
      p.strokeCircle(7, 0, 12);

      p.lineStyle(1, 0x94601f);
      p.strokeCircle(7, 0, 7);

      p.fillStyle(0xffe6a0);
      p.fillTriangle(4, 3, 10, 3, 7, -5);
    }
  }

  // ===========================================
  // ANIMATION
  // ===========================================

  setPose(name, duration = 100) {
    const pose = POSES[name] || POSES.idle;

    if (this.currentPose === name) return;

    this.currentPose = name;

    const targets = [
      [this.parts.torso, pose.torso],

      [this.parts.armL.upper, pose.armLU],
      [this.parts.armL.lower, pose.armLL],

      [this.parts.armR.upper, pose.armRU],
      [this.parts.armR.lower, pose.armRL],

      [this.parts.legL.upper, pose.legLU],
      [this.parts.legL.lower, pose.legLL],

      [this.parts.legR.upper, pose.legRU],
      [this.parts.legR.lower, pose.legRL]
    ];

    targets.forEach(([part, angle]) => {
      this.sceneRef.tweens.add({
        targets: part,
        angle,
        duration,
        ease: "Sine.easeOut"
      });
    });
  }

  // ===========================================
  // MOVE DATA
  // ===========================================

  getMove(name) {
    if (name === "special") {
      return SPECIAL_MOVES[this.character.id] || {
        name: "POWER STRIKE",
        pose: "kick",
        windup: 140,
        active: 130,
        recovery: 300,
        damage: 18,
        knockback: 300,
        lift: 65,
        targetZones: ["head", "torso"],
        hitbox: { x: 65, y: -90, width: 80, height: 75 },
        effectColor: 0xffc66b
      };
    }

    return MOVES[name] || null;
  }

  // ===========================================
  // PERFORM MOVE
  // ===========================================

  perform(name, callbacks = {}) {
    if (this.isActing) return false;

    const move = this.getMove(name);
    if (!move) return false;

    this.isActing = true;
    this.currentMove = move;
    this.actionPhase = "windup";

    const token = ++this.actionToken;
    const speed = this.sceneRef.actionSpeed || 1;
    const windup = Math.round(move.windup * speed);
    const active = Math.round(move.active * speed);
    const recovery = Math.round(move.recovery * speed);

    this.setPose("guard", windup);

    this.sceneRef.time.delayedCall(windup, () => {
      if (token !== this.actionToken || !this.active) return;

      this.actionPhase = "active";
      this.setPose(move.pose, Math.round(65 * speed));

      if (move.effectColor) {
        this.showSpecialEffect(move.effectColor);
      }
    });

    const impactDelay = windup + Math.round(active * 0.35);

    this.sceneRef.time.delayedCall(impactDelay, () => {
      if (token !== this.actionToken || !this.active) return;

      this.actionPhase = "active";
      callbacks.onImpact?.(move);
    });

    this.sceneRef.time.delayedCall(
      windup + active,
      () => {
        if (token !== this.actionToken || !this.active) return;

        this.actionPhase = "recovery";
        this.setPose("guard", recovery);
      }
    );

    this.sceneRef.time.delayedCall(
      windup + active + recovery,
      () => {
        if (token !== this.actionToken || !this.active) return;

        this.isActing = false;
        this.currentMove = null;
        this.actionPhase = null;
        this.setPose("idle", 110);

        callbacks.onComplete?.();
      }
    );

    return true;
  }

  // ===========================================
  // BODY HITBOXES
  // These are world-space rectangles.
  // ===========================================

  getHurtboxes() {
    const sx = Math.abs(this.scaleX || 1);
    const sy = Math.abs(this.scaleY || 1);

    const rect = (zone, offsetY, width, height) => ({
      zone,
      x: this.x - width * sx / 2,
      y: this.y + offsetY * sy - height * sy / 2,
      width: width * sx,
      height: height * sy
    });

    return [
      rect("head", -151, 31, 32),
      rect("torso", -96, 48, 62),
      rect("legs", -30, 45, 55)
    ];
  }

  // ===========================================
  // ATTACK HITBOXES
  // ===========================================

  getAttackHitbox(move) {
    const box = move.hitbox;

    const sx = Math.abs(this.scaleX || 1);
    const sy = Math.abs(this.scaleY || 1);

    const centerX =
      this.x + this.facing * box.x * sx;

    const centerY =
      this.y + box.y * sy;

    return {
      x: centerX - box.width * sx / 2,
      y: centerY - box.height * sy / 2,
      width: box.width * sx,
      height: box.height * sy
    };
  }

  // ===========================================
  // SPECIAL MOVE EFFECT
  // ===========================================

  showSpecialEffect(color) {
    const g = this.specialEffect;

    g.clear();

    g.lineStyle(4, color, 0.9);
    g.strokeCircle(0, -95, 38);

    g.lineStyle(2, 0xffe7b0, 0.8);
    g.strokeCircle(0, -95, 49);

    g.alpha = 1;

    this.sceneRef.tweens.add({
      targets: g,
      alpha: 0,
      duration: 420,
      onComplete: () => {
        if (!g.active) return;
        g.clear();
        g.alpha = 1;
      }
    });
  }

  // ===========================================
  // HIT REACTION
  // ===========================================

  reactToHit() {
    this.actionToken++;
    this.isActing = false;
    this.currentMove = null;
    this.actionPhase = null;

    this.setPose("hit", 65);

    this.sceneRef.time.delayedCall(260, () => {
      if (this.active && !this.isActing) {
        this.setPose("idle", 110);
      }
    });
  }

  resetPose() {
    this.actionToken++;
    this.isActing = false;
    this.currentMove = null;
    this.actionPhase = null;
    this.setPose("idle", 100);
  }
}

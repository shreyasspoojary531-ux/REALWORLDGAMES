import { GameEngine } from '@/lib/engineInterface';

export const BOARD_SIZE = 700;
export const POCKET_RADIUS = 34;
export const COIN_RADIUS = 16;
export const STRIKER_RADIUS = 21;
export const PLAY_AREA_INSET = 38; // Cushion wall boundary

// 4 Corner Pockets
export const POCKETS = [
  { x: 44, y: 44 },
  { x: BOARD_SIZE - 44, y: 44 },
  { x: 44, y: BOARD_SIZE - 44 },
  { x: BOARD_SIZE - 44, y: BOARD_SIZE - 44 },
];

export class CarromEngine extends GameEngine {
  constructor() {
    super();
    this.coins = []; // { id, type: 'white'|'black'|'queen', x, y, vx, vy, radius, pocketed }
    this.striker = null; // { x, y, vx, vy, radius, pocketed }
    this.turn = 'player1'; // 'player1' (White) | 'player2' (Black/AI)
    this.scores = { player1: 0, player2: 0 };
    this.queenState = 'on_board'; // 'on_board' | 'pending_cover' | 'covered'
    this.queenCoverBy = null;
    this.pendingDueCoins = { player1: 0, player2: 0 };
    this.mode = 'pve'; // 'pve' | 'pvp'
    this.isShotActive = false;
    this.strikerBaseY = 590; // Player 1 baseline Y
  }

  init(config = {}) {
    this.mode = config.mode || 'pve';
    this.scores = { player1: 0, player2: 0 };
    this.turn = 'player1';
    this.queenState = 'on_board';
    this.queenCoverBy = null;
    this.pendingDueCoins = { player1: 0, player2: 0 };
    this.isShotActive = false;

    this.setupPieces();
    return this.getState();
  }

  setupPieces() {
    this.coins = [];
    const center = BOARD_SIZE / 2;

    // 1 Queen at center
    this.coins.push({
      id: 'queen',
      type: 'queen',
      x: center,
      y: center,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      mass: 1,
      pocketed: false,
    });

    // Inner ring: 6 coins at radius 33 (alternating: White, Black, White, Black, White, Black)
    const r1 = 33;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const type = i % 2 === 0 ? 'white' : 'black';
      this.coins.push({
        id: `ring1-${i}`,
        type,
        x: center + Math.cos(angle) * r1,
        y: center + Math.sin(angle) * r1,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: 1,
        pocketed: false,
      });
    }

    // Outer ring: 12 coins at radius 66 (6 white, 6 black)
    const r2 = 66;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const type = i % 2 === 0 ? 'black' : 'white';
      this.coins.push({
        id: `ring2-${i}`,
        type,
        x: center + Math.cos(angle) * r2,
        y: center + Math.sin(angle) * r2,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: 1,
        pocketed: false,
      });
    }

    // Striker initialized at center of baseline
    this.striker = {
      id: 'striker',
      type: 'striker',
      x: center,
      y: this.strikerBaseY,
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      mass: 1.5,
      pocketed: false,
    };
  }

  getBaselineBounds() {
    const minX = 145;
    const maxX = BOARD_SIZE - 145;
    const y = this.turn === 'player1' ? this.strikerBaseY : BOARD_SIZE - this.strikerBaseY;
    return { minX, maxX, y };
  }

  setStrikerPosition(baselineX) {
    if (this.isShotActive || !this.striker) return;
    const { minX, maxX, y } = this.getBaselineBounds();
    this.striker.x = Math.max(minX, Math.min(maxX, baselineX));
    this.striker.y = y;
    this.striker.vx = 0;
    this.striker.vy = 0;
  }

  applyAction(action) {
    if (action.type === 'strike') {
      return this.fireStriker(action.vector, action.power);
    }
    return this.getState();
  }

  fireStriker(vector, power) {
    if (this.isShotActive || !this.striker) return false;
    const len = Math.hypot(vector.x, vector.y);
    if (len < 0.001) return false;

    // Scale speed smoothly: power 10 to 100 maps to speed 14 to 34
    const clampedPower = Math.max(10, Math.min(100, power));
    const speed = 12 + (clampedPower / 100) * 22;

    this.striker.vx = (vector.x / len) * speed;
    this.striker.vy = (vector.y / len) * speed;
    this.isShotActive = true;
    return true;
  }

  /**
   * Pure 2D physics step
   * Uses fixed sub-stepping for numerical stability and accurate circle-circle collision
   */
  step(deltaSeconds = 1 / 60) {
    if (!this.isShotActive) return { isResting: true, pocketedThisStep: [] };

    const pocketedThisStep = [];
    const subSteps = 6;
    const dt = deltaSeconds / subSteps;
    const frictionPerSubStep = Math.pow(0.985, dt * 60);
    const REST_SPEED = 0.08;

    const allBodies = [this.striker, ...this.coins.filter((c) => !c.pocketed)];

    for (let s = 0; s < subSteps; s++) {
      // 1. Move bodies
      for (const b of allBodies) {
        if (b.pocketed) continue;
        b.x += b.vx * dt * 60;
        b.y += b.vy * dt * 60;
        b.vx *= frictionPerSubStep;
        b.vy *= frictionPerSubStep;
      }

      // 2. Wall collisions (board cushions)
      const minX = PLAY_AREA_INSET;
      const maxX = BOARD_SIZE - PLAY_AREA_INSET;
      const minY = PLAY_AREA_INSET;
      const maxY = BOARD_SIZE - PLAY_AREA_INSET;
      const restitution = 0.9;

      for (const b of allBodies) {
        if (b.pocketed) continue;
        if (b.x - b.radius < minX) {
          b.x = minX + b.radius;
          b.vx = -b.vx * restitution;
        } else if (b.x + b.radius > maxX) {
          b.x = maxX - b.radius;
          b.vx = -b.vx * restitution;
        }

        if (b.y - b.radius < minY) {
          b.y = minY + b.radius;
          b.vy = -b.vy * restitution;
        } else if (b.y + b.radius > maxY) {
          b.y = maxY - b.radius;
          b.vy = -b.vy * restitution;
        }
      }

      // 3. Circle-circle collisions
      for (let i = 0; i < allBodies.length; i++) {
        const b1 = allBodies[i];
        if (b1.pocketed) continue;

        for (let j = i + 1; j < allBodies.length; j++) {
          const b2 = allBodies[j];
          if (b2.pocketed) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b1.radius + b2.radius;

          if (dist < minDist && dist > 0.0001) {
            // Normal unit vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping bodies
            const overlap = (minDist - dist) * 0.5;
            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            // Relative velocity along normal
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

            // Elastic collision with restitution 0.92
            const e = 0.92;
            b1.vx -= p * b2.mass * nx * e;
            b1.vy -= p * b2.mass * ny * e;
            b2.vx += p * b1.mass * nx * e;
            b2.vy += p * b1.mass * ny * e;
          }
        }
      }

      // 4. Pocket detection
      for (const b of allBodies) {
        if (b.pocketed) continue;
        for (const p of POCKETS) {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < POCKET_RADIUS) {
            b.pocketed = true;
            b.vx = 0;
            b.vy = 0;
            pocketedThisStep.push(b);
            break;
          }
        }
      }
    }

    // 5. Rest detection: all unpocketed bodies must have speed < REST_SPEED
    let isResting = true;
    for (const b of allBodies) {
      if (b.pocketed) continue;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > REST_SPEED) {
        isResting = false;
      } else {
        b.vx = 0;
        b.vy = 0;
      }
    }

    return { isResting, pocketedThisStep };
  }

  resolveTurn(pocketedInShot) {
    this.isShotActive = false;
    const player = this.turn;
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const playerColor = player === 'player1' ? 'white' : 'black';

    const pocketedStriker = pocketedInShot.some((p) => p.type === 'striker');
    const pocketedOwn = pocketedInShot.filter((p) => p.type === playerColor);
    const pocketedOpponent = pocketedInShot.filter((p) => p.type === (playerColor === 'white' ? 'black' : 'white'));
    const pocketedQueen = pocketedInShot.some((p) => p.type === 'queen');

    let continueTurn = false;

    // 1. Foul: Striker pocketed
    if (pocketedStriker) {
      this.pendingDueCoins[player]++;
      this.returnDueCoin(player, playerColor);
      continueTurn = false;
    }

    // 2. Queen logic
    if (pocketedQueen) {
      this.queenState = 'pending_cover';
      this.queenCoverBy = player;
      continueTurn = true;
    } else if (this.queenState === 'pending_cover' && this.queenCoverBy === player) {
      // Check if Queen was covered this turn
      if (pocketedOwn.length > 0 && !pocketedStriker) {
        this.queenState = 'covered';
        this.scores[player] += 3;
        continueTurn = true;
      } else {
        // Failed to cover Queen: Queen returns to center!
        this.returnQueenToCenter();
        this.queenState = 'on_board';
        this.queenCoverBy = null;
      }
    }

    // 3. Own coins scored
    if (pocketedOwn.length > 0 && !pocketedStriker) {
      this.scores[player] += pocketedOwn.length;
      continueTurn = true;
    }

    // 4. Opponent coins pocketed (counts for opponent, turn passes)
    if (pocketedOpponent.length > 0) {
      this.scores[opponent] += pocketedOpponent.length;
    }

    // Advance turn if not continuing
    if (!continueTurn) {
      this.turn = opponent;
    }

    // Reset striker to new turn player's baseline center
    this.striker.pocketed = false;
    this.setStrikerPosition(BOARD_SIZE / 2);

    return {
      turn: this.turn,
      scores: this.scores,
      queenState: this.queenState,
      terminal: this.isTerminal(),
    };
  }

  returnQueenToCenter() {
    const queen = this.coins.find((c) => c.type === 'queen');
    if (queen) {
      queen.pocketed = false;
      queen.x = BOARD_SIZE / 2;
      queen.y = BOARD_SIZE / 2;
      queen.vx = 0;
      queen.vy = 0;
    }
  }

  returnDueCoin(_player, playerColor) {
    const dueCoin = this.coins.find((c) => c.type === playerColor && c.pocketed);
    if (dueCoin) {
      dueCoin.pocketed = false;
      dueCoin.x = BOARD_SIZE / 2 + (Math.random() - 0.5) * 20;
      dueCoin.y = BOARD_SIZE / 2 + (Math.random() - 0.5) * 20;
      dueCoin.vx = 0;
      dueCoin.vy = 0;
    }
  }

  /**
   * Computer Player AI: Simple geometry shot chooser
   * Finds the best candidate coin & pocket, calculates aim point behind coin,
   * adds subtle noise, and returns position, vector, and power under 0.8s total.
   */
  computeAiShot() {
    const activeTargets = this.coins.filter((c) => !c.pocketed && (c.type === 'black' || c.type === 'queen'));
    if (activeTargets.length === 0) return null;

    const baselineY = BOARD_SIZE - this.strikerBaseY; // Top baseline for Player 2
    const minBaselineX = 145;
    const maxBaselineX = BOARD_SIZE - 145;

    let bestScore = -Infinity;
    let bestShot = null;

    for (const target of activeTargets) {
      for (const pocket of POCKETS) {
        // Distance from coin to pocket
        const toPocketX = pocket.x - target.x;
        const toPocketY = pocket.y - target.y;
        const distToPocket = Math.hypot(toPocketX, toPocketY);
        if (distToPocket < 0.001) continue;

        const dirToPocketX = toPocketX / distToPocket;

        // Ideal contact point behind coin
        const contactDist = COIN_RADIUS + STRIKER_RADIUS;
        const aimX = target.x - dirToPocketX * contactDist;

        // Striker must push from behind (so aim point must be roughly in the direction of baseline)
        // Since AI is at top (baselineY ~ 110), shots directed towards bottom pockets (y > 350)
        // or angled towards top pockets must have aimY near or reachable from baseline.
        // Clamp baselineX to align with aim point
        const strikerX = Math.max(minBaselineX, Math.min(maxBaselineX, aimX));
        const shotVectorX = target.x - strikerX;
        const shotVectorY = target.y - baselineY;
        const shotDist = Math.hypot(shotVectorX, shotVectorY);

        // Scoring heuristic: prefer closer targets to pockets and clean approach
        const targetBonus = target.type === 'queen' ? 60 : 0;
        const score = 1000 - distToPocket - shotDist * 0.5 + targetBonus;

        if (score > bestScore) {
          bestScore = score;
          bestShot = {
            strikerX,
            target,
            pocket,
            dx: shotVectorX,
            dy: shotVectorY,
            dist: shotDist,
          };
        }
      }
    }

    if (!bestShot) {
      // Fallback safe shot toward center
      const center = BOARD_SIZE / 2;
      return {
        strikerX: center,
        vector: { x: 0, y: 1 },
        power: 55,
      };
    }

    // Add tiny realistic aiming error (~2 degrees)
    const baseAngle = Math.atan2(bestShot.dy, bestShot.dx);
    const angleNoise = (Math.random() - 0.5) * 0.07;
    const finalAngle = baseAngle + angleNoise;

    const power = Math.min(95, Math.max(50, (bestShot.dist / 380) * 85));

    return {
      strikerX: bestShot.strikerX,
      vector: {
        x: Math.cos(finalAngle),
        y: Math.sin(finalAngle),
      },
      power,
    };
  }

  isTerminal() {
    const whiteCoinsLeft = this.coins.filter((c) => !c.pocketed && c.type === 'white').length;
    const blackCoinsLeft = this.coins.filter((c) => !c.pocketed && c.type === 'black').length;

    if (whiteCoinsLeft === 0) {
      const bonus = this.queenCoverBy === 'player1' ? 3 : 0;
      const boardScore = blackCoinsLeft + bonus;
      return {
        terminal: true,
        winner: 'player1',
        boardScore,
        reason: 'cleared_board',
      };
    }

    if (blackCoinsLeft === 0) {
      const bonus = this.queenCoverBy === 'player2' ? 3 : 0;
      const boardScore = whiteCoinsLeft + bonus;
      return {
        terminal: true,
        winner: 'player2',
        boardScore,
        reason: 'cleared_board',
      };
    }

    return { terminal: false, winner: null };
  }

  getLegalActions() {
    return [{ type: 'strike', minPower: 10, maxPower: 100 }];
  }

  getScore() {
    return {
      player1: this.scores.player1,
      player2: this.scores.player2,
    };
  }

  getState() {
    return {
      turn: this.turn,
      scores: this.scores,
      queenState: this.queenState,
      queenCoverBy: this.queenCoverBy,
      coins: this.coins.map((c) => ({
        id: c.id,
        type: c.type,
        pocketed: c.pocketed,
        x: c.x,
        y: c.y,
      })),
      striker: this.striker
        ? {
            x: this.striker.x,
            y: this.striker.y,
            pocketed: this.striker.pocketed,
          }
        : null,
      isShotActive: this.isShotActive,
    };
  }

  serialize() {
    return {
      turn: this.turn,
      scores: this.scores,
      queenState: this.queenState,
      mode: this.mode,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.turn = data.turn || 'player1';
    this.scores = data.scores || { player1: 0, player2: 0 };
    this.queenState = data.queenState || 'on_board';
    this.mode = data.mode || 'pve';
  }
}

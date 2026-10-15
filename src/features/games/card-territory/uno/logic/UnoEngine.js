import { GameEngine } from '@/lib/engineInterface';
import { SeededRNG } from '@/lib/rng';

export const COLORS = ['red', 'blue', 'green', 'yellow'];

/**
 * Standard official 108-card Uno deck:
 * - 19 cards per color: One '0', two each of '1'-'9' (19 * 4 = 76)
 * - 8 Action cards per color: Two Skips, two Reverses, two Draw Twos (+2) (8 * 4 = 24)
 * - 4 Wild cards
 * - 4 Wild Draw Four (+4) cards
 * Total = 76 + 24 + 4 + 4 = 108 cards.
 */
export function createUnoDeck(rng = new SeededRNG()) {
  const deck = [];

  for (const color of COLORS) {
    // One '0' per color
    deck.push({
      id: `${color}-0-${Math.random().toString(36).slice(2, 6)}`,
      color,
      val: '0',
      type: 'number',
      points: 0,
    });

    // Two of each '1' through '9' per color
    for (let i = 1; i <= 9; i++) {
      for (let c = 0; c < 2; c++) {
        deck.push({
          id: `${color}-${i}-${c}-${Math.random().toString(36).slice(2, 6)}`,
          color,
          val: String(i),
          type: 'number',
          points: i,
        });
      }
    }

    // Two of each Action card per color: Skip, Reverse, Draw Two
    for (const action of ['Skip', 'Reverse', '+2']) {
      for (let c = 0; c < 2; c++) {
        deck.push({
          id: `${color}-${action}-${c}-${Math.random().toString(36).slice(2, 6)}`,
          color,
          val: action,
          type: 'action',
          points: 20,
        });
      }
    }
  }

  // 4 Wild cards and 4 Wild Draw Four cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild-${i}-${Math.random().toString(36).slice(2, 6)}`,
      color: 'wild',
      val: 'Wild',
      type: 'wild',
      points: 50,
    });
    deck.push({
      id: `wild4-${i}-${Math.random().toString(36).slice(2, 6)}`,
      color: 'wild',
      val: '+4',
      type: 'wild4',
      points: 50,
    });
  }

  return rng.shuffle(deck);
}

export class UnoEngine extends GameEngine {
  constructor(rng = new SeededRNG()) {
    super();
    this.rng = rng;
    this.playerCount = 3; // 1 Human + 2 Bots by default (supports 2 to 4 players)
    this.players = [];

    this.drawPile = [];
    this.discardPile = [];
    this.activeColor = 'red';
    this.topDiscard = null;

    this.activePlayerIdx = 0;
    this.direction = 1; // 1: clockwise, -1: counter-clockwise

    this.calledUno = []; // boolean per player
    this.hasDrawnThisTurn = false;
    this.drawnPlayableCard = null;

    this.targetScore = 500;
    this.totalScores = [];
    this.roundHistory = [];
    this.currentRound = 1;

    this.isRoundOver = false;
    this.roundWinner = null;
    this.isMatchOver = false;
    this.matchWinner = null;
  }

  init(config = {}) {
    this.playerCount = config.playerCount ?? 3; // 1 Human (0) + 2 Computer bots (1, 2)
    this.targetScore = config.targetScore ?? 500;

    this.players = [
      { id: 'player', name: 'You', isHuman: true },
      { id: 'bot1', name: 'Bot 1', isHuman: false },
      { id: 'bot2', name: 'Bot 2', isHuman: false },
    ];
    if (this.playerCount === 2) {
      this.players = [
        { id: 'player', name: 'You', isHuman: true },
        { id: 'bot1', name: 'Bot 1', isHuman: false },
      ];
    } else if (this.playerCount === 4) {
      this.players.push({ id: 'bot3', name: 'Bot 3', isHuman: false });
    }

    this.totalScores = this.players.map(() => 0);
    this.roundHistory = [];
    this.currentRound = 1;
    this.isMatchOver = false;
    this.matchWinner = null;

    this.startRound();
    return this.getState();
  }

  startRound() {
    const fullDeck = createUnoDeck(this.rng);

    // Deal 7 cards to each player
    this.hands = this.players.map(() => fullDeck.splice(0, 7));

    // Initial discard cannot be wild or wild4
    let top = fullDeck.pop();
    while (top.color === 'wild') {
      fullDeck.unshift(top);
      top = fullDeck.pop();
    }

    this.topDiscard = top;
    this.activeColor = top.color;
    this.discardPile = [top];
    this.drawPile = fullDeck;

    this.activePlayerIdx = 0; // Human begins
    this.direction = 1; // Clockwise
    this.calledUno = this.players.map(() => false);
    this.hasDrawnThisTurn = false;
    this.drawnPlayableCard = null;

    this.isRoundOver = false;
    this.roundWinner = null;
  }

  drawCardFromPile(playerIdx = this.activePlayerIdx) {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) return null;
      // Reshuffle discard pile into draw pile
      const top = this.discardPile.pop();
      this.drawPile = this.rng.shuffle(this.discardPile);
      this.discardPile = [top];
    }

    const card = this.drawPile.pop();
    if (!card) return null;

    this.hands[playerIdx].push(card);
    // If hand has more than 1 card, reset UNO call
    if (this.hands[playerIdx].length > 1) {
      this.calledUno[playerIdx] = false;
    }

    return card;
  }

  isCardPlayable(card) {
    if (!card || !this.topDiscard) return false;
    if (card.color === 'wild') return true;
    if (card.color === this.activeColor) return true;
    if (card.val === this.topDiscard.val) return true;
    return false;
  }

  getNextPlayerIndex(step = 1) {
    const n = this.players.length;
    return (this.activePlayerIdx + step * this.direction + n * 10) % n;
  }

  callUno(playerIdx = this.activePlayerIdx) {
    if (this.hands[playerIdx].length <= 2) {
      this.calledUno[playerIdx] = true;
      return true;
    }
    return false;
  }

  /**
   * Enforces official Uno penalty:
   * If a player had 1 card left and didn't call UNO, when the next player begins their turn,
   * they can be caught or automatically penalized 2 cards.
   */
  checkMissedUnoPenalty(playerIdx) {
    if (this.hands[playerIdx].length === 1 && !this.calledUno[playerIdx]) {
      this.drawCardFromPile(playerIdx);
      this.drawCardFromPile(playerIdx);
      return true;
    }
    return false;
  }

  playCard(cardId, chosenColor = null) {
    if (this.isRoundOver) return false;
    const actorIdx = this.activePlayerIdx;
    const hand = this.hands[actorIdx];

    const cardIdx = hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) return false;

    const card = hand[cardIdx];
    if (!this.isCardPlayable(card)) return false;

    // Remove played card from actor's hand and put on discard pile
    hand.splice(cardIdx, 1);
    this.discardPile.push(card);
    this.topDiscard = card;

    // Resolve color
    if (card.color === 'wild') {
      this.activeColor = chosenColor || 'red';
    } else {
      this.activeColor = card.color;
    }

    // Check round victory
    if (hand.length === 0) {
      this.resolveRoundWin(actorIdx);
      return true;
    }

    // If down to 1 card and bot, bot calls UNO automatically
    if (hand.length === 1 && !this.players[actorIdx].isHuman) {
      this.calledUno[actorIdx] = true;
    }

    // Calculate action card outcomes
    let advanceStep = 1;
    const isTwoPlayer = this.players.length === 2;

    if (card.val === 'Skip') {
      advanceStep = 2; // Skips next player
    } else if (card.val === 'Reverse') {
      if (isTwoPlayer) {
        // In 2 players, Reverse functions identically to a Skip
        advanceStep = 2;
      } else {
        this.direction *= -1; // Reverse rotation direction
        advanceStep = 1;
      }
    } else if (card.val === '+2') {
      const target = this.getNextPlayerIndex(1);
      this.drawCardFromPile(target);
      this.drawCardFromPile(target);
      advanceStep = 2; // Target forfeits turn
    } else if (card.val === '+4') {
      const target = this.getNextPlayerIndex(1);
      for (let i = 0; i < 4; i++) {
        this.drawCardFromPile(target);
      }
      advanceStep = 2; // Target forfeits turn
    }

    this.advanceTurn(advanceStep);
    return true;
  }

  playerDraw() {
    if (this.activePlayerIdx !== 0 || this.isRoundOver || this.hasDrawnThisTurn) return false;

    const drawn = this.drawCardFromPile(0);
    this.hasDrawnThisTurn = true;

    // If drawn card is playable, allow player to play it or pass
    if (this.isCardPlayable(drawn)) {
      this.drawnPlayableCard = drawn;
    } else {
      // Cannot play, end player turn
      this.advanceTurn(1);
    }
    return drawn;
  }

  passTurn() {
    if (this.activePlayerIdx !== 0 || !this.hasDrawnThisTurn) return false;
    this.advanceTurn(1);
    return true;
  }

  advanceTurn(step = 1) {
    const prevIdx = this.activePlayerIdx;

    // Check if prev player had 1 card and forgot to call UNO
    this.checkMissedUnoPenalty(prevIdx);

    this.activePlayerIdx = this.getNextPlayerIndex(step);
    this.hasDrawnThisTurn = false;
    this.drawnPlayableCard = null;
  }

  resolveRoundWin(winnerIdx) {
    this.isRoundOver = true;
    this.roundWinner = winnerIdx;

    // Calculate points from all other hands:
    // Numbers: face value | Actions: 20 | Wilds: 50
    let points = 0;
    this.hands.forEach((hand, idx) => {
      if (idx !== winnerIdx) {
        hand.forEach((card) => {
          points += card.points || 0;
        });
      }
    });

    this.totalScores[winnerIdx] += points;

    this.roundHistory.push({
      round: this.currentRound,
      winnerName: this.players[winnerIdx].name,
      pointsAwarded: points,
      scoresSnapshot: [...this.totalScores],
    });

    // Check match victory (Target: 500 pts)
    if (this.totalScores.some((s) => s >= this.targetScore)) {
      this.isMatchOver = true;
      const highestScore = Math.max(...this.totalScores);
      this.matchWinner = this.players[this.totalScores.indexOf(highestScore)].id;
    }
  }

  /**
   * Fast rule-based AI turn (<10ms evaluation, no artificial delay):
   * 1. Auto-call UNO if 2 cards.
   * 2. Choose matching card (preferring action cards if an opponent has 2 or fewer cards).
   * 3. Choose most-held color for wild cards.
   * 4. Draw if no valid card. Play drawn card if valid.
   */
  computeBotAction(botIdx = this.activePlayerIdx) {
    if (this.activePlayerIdx !== botIdx || this.isRoundOver) return null;

    const hand = this.hands[botIdx];

    // 1. Auto-call UNO
    if (hand.length <= 2) {
      this.callUno(botIdx);
    }

    // Check if any opponent has few cards (<=2) to prioritize action cards
    const opponentHasFewCards = this.hands.some((h, i) => i !== botIdx && h.length <= 2);

    // 2. Filter playable cards
    const playable = hand.filter((c) => this.isCardPlayable(c));

    if (playable.length > 0) {
      // Sort playable cards: If opponent close to winning, play Action cards (+4, +2, Skip, Reverse) first
      playable.sort((a, b) => {
        if (opponentHasFewCards) {
          return (b.points || 0) - (a.points || 0);
        }
        return (a.points || 0) - (b.points || 0);
      });

      const chosen = playable[0];
      let chosenColor = chosen.color;

      if (chosen.color === 'wild') {
        // Choose color bot holds the most of
        const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
        hand.forEach((c) => {
          if (c.color !== 'wild') counts[c.color]++;
        });
        chosenColor = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || 'red';
      }

      this.playCard(chosen.id, chosenColor);
      return { type: 'play', card: chosen };
    }

    // 3. No playable card: Draw 1 card
    const drawn = this.drawCardFromPile(botIdx);
    if (drawn && this.isCardPlayable(drawn)) {
      let chosenColor = drawn.color;
      if (drawn.color === 'wild') {
        const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
        hand.forEach((c) => {
          if (c.color !== 'wild') counts[c.color]++;
        });
        chosenColor = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || 'red';
      }
      this.playCard(drawn.id, chosenColor);
      return { type: 'draw_and_play', card: drawn };
    }

    // End turn
    this.advanceTurn(1);
    return { type: 'draw_pass' };
  }

  isTerminal() {
    return {
      terminal: this.isMatchOver,
      winner: this.matchWinner,
    };
  }

  getScore() {
    return {
      totalScores: [...this.totalScores],
      targetScore: this.targetScore,
      isRoundOver: this.isRoundOver,
    };
  }

  getState() {
    return {
      activePlayerIdx: this.activePlayerIdx,
      activeColor: this.activeColor,
      topDiscard: this.topDiscard,
      direction: this.direction, // 1 (clockwise) | -1 (counter-clockwise)
      playerHand: [...this.hands[0]],
      players: this.players.map((p, idx) => ({
        id: p.id,
        name: p.name,
        isHuman: p.isHuman,
        cardCount: this.hands[idx].length,
        calledUno: this.calledUno[idx],
        totalScore: this.totalScores[idx],
      })),
      drawPileCount: this.drawPile.length,
      hasDrawnThisTurn: this.hasDrawnThisTurn,
      drawnPlayableCard: this.drawnPlayableCard,
      isRoundOver: this.isRoundOver,
      roundWinner: this.roundWinner,
      isMatchOver: this.isMatchOver,
      matchWinner: this.matchWinner,
      targetScore: this.targetScore,
      currentRound: this.currentRound,
      roundHistory: [...this.roundHistory],
    };
  }

  serialize() {
    return {
      totalScores: this.totalScores,
      currentRound: this.currentRound,
      targetScore: this.targetScore,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.totalScores = data.totalScores || this.players.map(() => 0);
    this.currentRound = data.currentRound || 1;
    this.targetScore = data.targetScore || 500;
  }
}

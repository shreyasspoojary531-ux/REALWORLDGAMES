import { GameEngine } from '@/lib/engineInterface';

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Standard 52-card single deck
 */
export function createDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${suit}-${rank}-${Math.random().toString(36).slice(2, 7)}`,
        suit,
        rank,
        value: getCardValue(rank),
      });
    }
  }
  return shuffleDeck(cards);
}

/**
 * In-place Fisher-Yates shuffle algorithm
 */
export function shuffleDeck(cards) {
  const array = [...cards];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function getCardValue(rank) {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J', '10'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/**
 * Calculates hand total, automatic Ace adjustment (11 or 1), soft indicator, and blackjack status
 */
export function calculateHandValue(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else {
      total += card.value;
    }
  }

  // Automatically count Aces as 1 instead of 11 if total exceeds 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isSoft = aces > 0 && total <= 21;
  const isBlackjack = cards.length === 2 && total === 21;
  const isBust = total > 21;

  return { total, isSoft, isBlackjack, isBust };
}

export class BlackjackEngine extends GameEngine {
  constructor() {
    super();
    this.deck = [];
    this.bankroll = 1000;
    this.currentBet = 50;
    this.phase = 'betting'; // 'betting' | 'player_turn' | 'dealer_turn' | 'round_over'
    this.dealerHand = [];
    this.playerHand = [];
    this.roundResult = null; // { outcome: 'win'|'lose'|'push'|'blackjack'|'bust', winnings, pTotal, dTotal }
  }

  init(config = {}) {
    if (config.bankroll !== undefined) this.bankroll = config.bankroll;
    if (config.bet !== undefined) this.currentBet = config.bet;
    this.deck = createDeck();
    this.resetRound();
    return this.getState();
  }

  resetRound() {
    // Reshuffle when fewer than 15 cards remain in the deck
    if (this.deck.length < 15) {
      this.deck = createDeck();
    }
    this.dealerHand = [];
    this.playerHand = [];
    this.roundResult = null;
    this.phase = 'betting';
  }

  drawCard() {
    if (this.deck.length < 15) {
      this.deck = createDeck();
    }
    return this.deck.pop();
  }

  placeBet(amount) {
    if (this.phase !== 'betting') return false;
    if (amount > this.bankroll || amount <= 0) return false;
    this.currentBet = amount;
    return true;
  }

  deal() {
    if (this.phase !== 'betting') return false;
    if (this.currentBet > this.bankroll) return false;

    // Deduct initial bet
    this.bankroll -= this.currentBet;

    // Deal two cards to player, two to dealer (second card hidden)
    const p1 = this.drawCard();
    const d1 = this.drawCard();
    const p2 = this.drawCard();
    const d2 = this.drawCard();

    this.playerHand = [p1, p2];
    this.dealerHand = [d1, d2];

    const pVal = calculateHandValue(this.playerHand);
    const dVal = calculateHandValue(this.dealerHand);

    // Natural blackjack resolution
    if (pVal.isBlackjack || dVal.isBlackjack) {
      this.resolveDealerTurn();
      return this.getState();
    }

    this.phase = 'player_turn';
    return this.getState();
  }

  hit() {
    if (this.phase !== 'player_turn') return false;

    const card = this.drawCard();
    this.playerHand.push(card);

    const { total, isBust } = calculateHandValue(this.playerHand);
    if (isBust || total === 21) {
      this.resolveDealerTurn();
    }

    return true;
  }

  stand() {
    if (this.phase !== 'player_turn') return false;
    this.resolveDealerTurn();
    return true;
  }

  doubleDown() {
    // Double down on first two cards only
    if (this.phase !== 'player_turn' || this.playerHand.length !== 2) return false;
    if (this.bankroll < this.currentBet) return false;

    // Deduct matching bet
    this.bankroll -= this.currentBet;
    this.currentBet *= 2;

    const card = this.drawCard();
    this.playerHand.push(card);

    // Immediately resolve after receiving exactly one card
    this.resolveDealerTurn();
    return true;
  }

  resolveDealerTurn() {
    this.phase = 'dealer_turn';

    const pVal = calculateHandValue(this.playerHand);

    // Dealer only draws if player did not bust and neither had a natural blackjack
    if (!pVal.isBust && !pVal.isBlackjack) {
      let dVal = calculateHandValue(this.dealerHand);
      // Dealer draws until 17 or more and stands on all 17s (hard or soft)
      while (dVal.total < 17) {
        this.dealerHand.push(this.drawCard());
        dVal = calculateHandValue(this.dealerHand);
      }
    }

    this.evaluatePayouts();
  }

  evaluatePayouts() {
    this.phase = 'round_over';
    const pVal = calculateHandValue(this.playerHand);
    const dVal = calculateHandValue(this.dealerHand);

    let outcome = 'lose';
    let winnings = 0;

    if (pVal.isBust) {
      outcome = 'bust';
      winnings = 0;
    } else if (pVal.isBlackjack && !dVal.isBlackjack) {
      // Natural Blackjack pays 3 to 2: returns original bet + 1.5x bet = 2.5x bet
      outcome = 'blackjack';
      winnings = Math.floor(this.currentBet * 2.5);
    } else if (pVal.isBlackjack && dVal.isBlackjack) {
      // Both have blackjack: push (return bet)
      outcome = 'push';
      winnings = this.currentBet;
    } else if (dVal.isBlackjack) {
      outcome = 'lose';
      winnings = 0;
    } else if (dVal.isBust) {
      // Dealer busts: win pays 1 to 1 (returns bet + bet = 2x bet)
      outcome = 'win';
      winnings = this.currentBet * 2;
    } else if (pVal.total > dVal.total) {
      // Win pays 1 to 1
      outcome = 'win';
      winnings = this.currentBet * 2;
    } else if (pVal.total === dVal.total) {
      // Push returns the bet
      outcome = 'push';
      winnings = this.currentBet;
    } else {
      outcome = 'lose';
      winnings = 0;
    }

    this.bankroll += winnings;
    this.roundResult = {
      outcome,
      winnings,
      pTotal: pVal.total,
      dTotal: dVal.total,
      bet: this.currentBet,
    };
  }

  resetBalance() {
    this.bankroll = 1000;
    this.resetRound();
    return this.getState();
  }

  applyAction(action) {
    if (action.type === 'bet') return this.placeBet(action.amount);
    if (action.type === 'deal') return this.deal();
    if (action.type === 'hit') return this.hit();
    if (action.type === 'stand') return this.stand();
    if (action.type === 'double') return this.doubleDown();
    if (action.type === 'reset_balance') return this.resetBalance();
    return false;
  }

  isTerminal() {
    return {
      terminal: this.bankroll <= 0 && this.phase === 'round_over',
      bankrupt: this.bankroll <= 0,
    };
  }

  getScore() {
    return {
      bankroll: this.bankroll,
      currentBet: this.currentBet,
    };
  }

  getLegalActions() {
    if (this.phase === 'betting') {
      return ['bet', 'deal'];
    }
    if (this.phase === 'player_turn') {
      const actions = ['hit', 'stand'];
      if (this.playerHand.length === 2 && this.bankroll >= this.currentBet) {
        actions.push('double');
      }
      return actions;
    }
    return [];
  }

  getState() {
    const isOver = this.phase === 'round_over' || this.phase === 'dealer_turn';
    return {
      phase: this.phase,
      bankroll: this.bankroll,
      currentBet: this.currentBet,
      dealerHand: this.dealerHand.map((c, i) => ({
        ...c,
        hidden: !isOver && i === 1,
      })),
      dealerValue: isOver
        ? calculateHandValue(this.dealerHand)
        : { total: this.dealerHand[0]?.value || 0, isSoft: false, isBlackjack: false, isBust: false },
      playerHand: [...this.playerHand],
      playerValue: calculateHandValue(this.playerHand),
      roundResult: this.roundResult,
      legalActions: this.getLegalActions(),
      deckRemaining: this.deck.length,
    };
  }

  serialize() {
    return {
      bankroll: this.bankroll,
      currentBet: this.currentBet,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.bankroll = data.bankroll || 1000;
    this.currentBet = data.currentBet || 50;
  }
}

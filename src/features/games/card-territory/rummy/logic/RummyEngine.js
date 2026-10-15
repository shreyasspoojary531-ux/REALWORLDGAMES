import { GameEngine } from '@/lib/engineInterface';
import { SeededRNG } from '@/lib/rng';

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const RANK_NUMBERS = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13,
};

/**
 * Penalty points calculation:
 * Face cards (K, Q, J) and Aces = 10 pts.
 * Numbered cards = face value (2-10).
 * Jokers = 0 pts.
 */
export function getCardPenalty(rank, isJoker = false) {
  if (isJoker || rank === 'PJ') return 0;
  if (['A', 'K', 'Q', 'J', '10'].includes(rank)) return 10;
  return parseInt(rank, 10) || 0;
}

/**
 * Creates 2 standard 52-card decks + 2 printed jokers (106 cards total)
 */
export function createRummyDeck(rng = new SeededRNG()) {
  const deck = [];
  for (let d = 1; d <= 2; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `${suit}-${rank}-d${d}-${Math.random().toString(36).slice(2, 6)}`,
          suit,
          rank,
          num: RANK_NUMBERS[rank],
          deckNumber: d,
        });
      }
    }
  }
  // 2 printed jokers
  deck.push({ id: 'PJ-1', suit: '★', rank: 'PJ', num: 0, isPrintedJoker: true });
  deck.push({ id: 'PJ-2', suit: '★', rank: 'PJ', num: 0, isPrintedJoker: true });

  return rng.shuffle(deck);
}

/**
 * Pure sequence:
 * 3 or more consecutive cards of the exact same suit.
 * Cannot use any wild jokers (as substitutes) or printed jokers.
 */
export function isPureSequence(cards) {
  if (!cards || cards.length < 3) return false;
  if (cards.some((c) => c.isPrintedJoker || c.isWildJoker)) return false;

  const suit = cards[0].suit;
  if (cards.some((c) => c.suit !== suit)) return false;

  const nums = cards.map((c) => c.num).sort((a, b) => a - b);
  // Check standard sequential
  let sequential = true;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i + 1] !== nums[i] + 1) {
      sequential = false;
      break;
    }
  }
  if (sequential) return true;

  // Check Ace-high sequence (e.g. Q-K-A or 10-J-Q-K-A)
  if (nums.includes(1) && nums.includes(13)) {
    const aceHighNums = nums.map((n) => (n === 1 ? 14 : n)).sort((a, b) => a - b);
    let aceHighSeq = true;
    for (let i = 0; i < aceHighNums.length - 1; i++) {
      if (aceHighNums[i + 1] !== aceHighNums[i] + 1) {
        aceHighSeq = false;
        break;
      }
    }
    if (aceHighSeq) return true;
  }

  return false;
}

/**
 * Impure sequence:
 * 3 or more consecutive cards of the same suit, with wild jokers or printed jokers bridging gaps.
 */
export function isImpureSequence(cards, wildRank) {
  if (!cards || cards.length < 3) return false;

  const isJoker = (c) => c.isPrintedJoker || c.isWildJoker || c.rank === wildRank;
  const naturalCards = cards.filter((c) => !isJoker(c));
  const jokerCount = cards.length - naturalCards.length;

  if (naturalCards.length === 0) return true; // All jokers can represent any sequence

  const suit = naturalCards[0].suit;
  if (naturalCards.some((c) => c.suit !== suit)) return false;

  // Check low-Ace ordering
  const checkNums = (numList) => {
    const sorted = [...numList].sort((a, b) => a - b);
    let needed = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = sorted[i + 1] - sorted[i];
      if (diff === 0) return false; // Duplicate natural card in same sequence
      needed += diff - 1;
    }
    return needed <= jokerCount;
  };

  const lowNums = naturalCards.map((c) => c.num);
  if (checkNums(lowNums)) return true;

  // Check Ace-high ordering if Ace is present
  if (lowNums.includes(1)) {
    const highNums = lowNums.map((n) => (n === 1 ? 14 : n));
    if (checkNums(highNums)) return true;
  }

  return false;
}

/**
 * Valid set:
 * 3 or 4 cards with matching rank across DIFFERENT suits.
 * Jokers can substitute for cards.
 */
export function isValidSet(cards, wildRank) {
  if (!cards || cards.length < 3 || cards.length > 4) return false;

  const isJoker = (c) => c.isPrintedJoker || c.isWildJoker || c.rank === wildRank;
  const naturalCards = cards.filter((c) => !isJoker(c));

  if (naturalCards.length === 0) return true;

  const targetRank = naturalCards[0].rank;
  if (naturalCards.some((c) => c.rank !== targetRank)) return false;

  // Natural cards in a set must have different suits
  const suits = naturalCards.map((c) => c.suit);
  const uniqueSuits = new Set(suits);
  return uniqueSuits.size === suits.length;
}

/**
 * Validates a complete 13-card declaration against standard 13-card Rummy rules:
 * - At least two sequences
 * - At least one PURE sequence (no jokers)
 * - The rest can be valid sequences (pure or impure) or valid sets.
 * Returns { isValid, pureSequenceFound, secondSequenceFound, allGroupsValid, message }
 */
export function validateDeclaration(groups, wildRank) {
  if (!groups || groups.length === 0) {
    return {
      isValid: false,
      pureSequenceFound: false,
      secondSequenceFound: false,
      allGroupsValid: false,
      message: 'No card groups provided.',
    };
  }

  const totalCards = groups.reduce((acc, g) => acc + g.length, 0);
  if (totalCards !== 13) {
    return {
      isValid: false,
      pureSequenceFound: false,
      secondSequenceFound: false,
      allGroupsValid: false,
      message: `Invalid card count: declaration requires exactly 13 cards (currently ${totalCards}).`,
    };
  }

  let pureSeqIndex = -1;
  let secondSeqIndex = -1;
  const groupStatuses = groups.map(() => false);

  // 1. First look for pure sequence
  for (let i = 0; i < groups.length; i++) {
    if (isPureSequence(groups[i])) {
      pureSeqIndex = i;
      groupStatuses[i] = true;
      break;
    }
  }

  if (pureSeqIndex === -1) {
    return {
      isValid: false,
      pureSequenceFound: false,
      secondSequenceFound: false,
      allGroupsValid: false,
      message: 'Missing Pure Sequence: At least one sequence of 3+ consecutive cards of the same suit without jokers is mandatory.',
    };
  }

  // 2. Look for second sequence (pure or impure) among remaining groups
  for (let i = 0; i < groups.length; i++) {
    if (i === pureSeqIndex) continue;
    if (isPureSequence(groups[i]) || isImpureSequence(groups[i], wildRank)) {
      secondSeqIndex = i;
      groupStatuses[i] = true;
      break;
    }
  }

  if (secondSeqIndex === -1) {
    return {
      isValid: false,
      pureSequenceFound: true,
      secondSequenceFound: false,
      allGroupsValid: false,
      message: 'Missing Second Sequence: A second sequence (pure or with jokers) is mandatory.',
    };
  }

  // 3. Verify all other groups are either valid sequences or valid sets
  let allGroupsValid = true;
  for (let i = 0; i < groups.length; i++) {
    if (groupStatuses[i]) continue;
    const g = groups[i];
    if (isPureSequence(g) || isImpureSequence(g, wildRank) || isValidSet(g, wildRank)) {
      groupStatuses[i] = true;
    } else {
      allGroupsValid = false;
    }
  }

  if (!allGroupsValid) {
    return {
      isValid: false,
      pureSequenceFound: true,
      secondSequenceFound: true,
      allGroupsValid: false,
      message: 'Invalid Group: Remaining cards must all form valid sequences or sets of 3-4 cards.',
    };
  }

  return {
    isValid: true,
    pureSequenceFound: true,
    secondSequenceFound: true,
    allGroupsValid: true,
    message: 'Valid declaration! Hand melded successfully.',
  };
}

export class RummyEngine extends GameEngine {
  constructor(rng = new SeededRNG()) {
    super();
    this.rng = rng;
    this.stockPile = [];
    this.discardPile = [];
    this.wildJoker = null;

    // 2 players: Human (player) and Computer (bot)
    this.playerHand = [];
    this.botHand = [];
    this.playerGroups = []; // Custom grouping for declaration

    this.turn = 'player'; // 'player' | 'bot'
    this.turnStep = 'draw'; // 'draw' | 'discard'

    // Cumulative points across rounds (round target: 200 points limit)
    this.scoreLimit = 200;
    this.totalScores = { player: 0, bot: 0 };
    this.roundHistory = []; // [ { round: 1, winner: 'player', playerPenalty: 0, botPenalty: 45 } ]
    this.currentRound = 1;

    this.isHandFinished = false;
    this.isMatchFinished = false;
    this.matchWinner = null;
    this.result = null;
  }

  init(config = {}) {
    if (config.scoreLimit) this.scoreLimit = config.scoreLimit;
    this.totalScores = { player: 0, bot: 0 };
    this.roundHistory = [];
    this.currentRound = 1;
    this.isMatchFinished = false;
    this.matchWinner = null;

    this.startRound();
    return this.getState();
  }

  startRound() {
    const deck = createRummyDeck(this.rng);
    this.playerHand = deck.splice(0, 13);
    this.botHand = deck.splice(0, 13);

    // Turn over wild joker card
    this.wildJoker = deck.pop();

    this.markWildCards(this.playerHand);
    this.markWildCards(this.botHand);

    // Initial open discard card
    const firstDiscard = deck.pop();
    this.discardPile = [firstDiscard];
    this.stockPile = deck;

    this.turn = 'player';
    this.turnStep = 'draw';
    this.isHandFinished = false;
    this.result = null;
  }

  markWildCards(cards) {
    for (const card of cards) {
      if (this.wildJoker && card.rank === this.wildJoker.rank) {
        card.isWildJoker = true;
      }
    }
  }

  drawCard(source = 'stock') {
    if (this.turnStep !== 'draw' || this.isHandFinished) return false;
    let card = null;

    if (source === 'discard') {
      if (this.discardPile.length === 0) return false;
      card = this.discardPile.pop();
    } else {
      if (this.stockPile.length === 0) {
        if (this.discardPile.length <= 1) return false;
        // Reshuffle discard pile into stock
        const top = this.discardPile.pop();
        this.stockPile = this.rng.shuffle(this.discardPile);
        this.discardPile = [top];
      }
      card = this.stockPile.pop();
    }

    if (!card) return false;
    if (this.wildJoker && card.rank === this.wildJoker.rank) {
      card.isWildJoker = true;
    }

    if (this.turn === 'player') {
      this.playerHand.push(card);
    } else {
      this.botHand.push(card);
    }

    this.turnStep = 'discard';
    return true;
  }

  discardCard(cardId) {
    if (this.turnStep !== 'discard' || this.isHandFinished) return false;
    const hand = this.turn === 'player' ? this.playerHand : this.botHand;
    const idx = hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return false;

    const [discarded] = hand.splice(idx, 1);
    this.discardPile.push(discarded);

    // Switch turn
    this.turn = this.turn === 'player' ? 'bot' : 'player';
    this.turnStep = 'draw';
    return true;
  }

  declare(groups = null) {
    if (this.isHandFinished) return false;

    const hand = this.turn === 'player' ? this.playerHand : this.botHand;
    const evalGroups = groups || this.autoGroupHand(hand);
    const validation = validateDeclaration(evalGroups, this.wildJoker?.rank);

    if (validation.isValid) {
      this.isHandFinished = true;
      const winner = this.turn;
      const loser = winner === 'player' ? 'bot' : 'player';
      const loserHand = winner === 'player' ? this.botHand : this.playerHand;
      const penalty = this.calculateHandPenalty(loserHand);

      this.totalScores[winner] += 0;
      this.totalScores[loser] += penalty;

      this.roundHistory.push({
        round: this.currentRound,
        winner,
        playerPenalty: winner === 'player' ? 0 : penalty,
        botPenalty: winner === 'bot' ? 0 : penalty,
      });

      this.result = {
        winner,
        loser,
        penalty,
        reason: 'valid_declare',
        message: `${winner === 'player' ? 'You' : 'Computer'} declared a valid show! Opponent scores ${penalty} penalty points.`,
      };

      // Check if either player breached score limit
      if (this.totalScores.player >= this.scoreLimit || this.totalScores.bot >= this.scoreLimit) {
        this.isMatchFinished = true;
        this.matchWinner = this.totalScores.player < this.totalScores.bot ? 'player' : 'bot';
      }

      return true;
    }

    return false;
  }

  calculateHandPenalty(hand) {
    let sum = 0;
    for (const card of hand) {
      sum += getCardPenalty(card.rank, card.isPrintedJoker || card.isWildJoker);
    }
    return Math.min(80, sum); // Standard Indian Rummy cap of 80 points per round
  }

  /**
   * Fast, intelligent bot turn decision (<10ms)
   */
  computeBotTurn() {
    if (this.turn !== 'bot' || this.isHandFinished) return;

    // 1. Draw decision: Take discard if it forms/extends a sequence or is a joker
    const topDiscard = this.discardPile[this.discardPile.length - 1];
    let wantsDiscard = false;

    if (topDiscard) {
      if (topDiscard.isPrintedJoker || topDiscard.isWildJoker || topDiscard.rank === this.wildJoker?.rank) {
        wantsDiscard = true;
      } else {
        // Check if topDiscard forms a sequence or set with bot's hand
        const hasMatchingRank = this.botHand.filter((c) => c.rank === topDiscard.rank).length >= 2;
        const hasMatchingSuit = this.botHand.filter(
          (c) => c.suit === topDiscard.suit && Math.abs(c.num - topDiscard.num) <= 2
        ).length >= 1;
        if (hasMatchingRank || hasMatchingSuit) {
          wantsDiscard = true;
        }
      }
    }

    this.drawCard(wantsDiscard ? 'discard' : 'stock');

    // 2. Check if Bot can declare right now
    if (this.botHand.length === 14) {
      // Try discarding each card and seeing if remaining 13 can declare
      for (let i = 0; i < this.botHand.length; i++) {
        const candidateHand = [...this.botHand.slice(0, i), ...this.botHand.slice(i + 1)];
        const candidateGroups = this.autoGroupHand(candidateHand);
        const val = validateDeclaration(candidateGroups, this.wildJoker?.rank);
        if (val.isValid) {
          // Discard card i and declare
          const discardId = this.botHand[i].id;
          this.discardCard(discardId);
          this.declare(candidateGroups);
          return;
        }
      }
    }

    // 3. Otherwise discard the least useful high-penalty card
    // Identify unmelded cards with high penalty
    const sorted = [...this.botHand].sort((a, b) => {
      const aJoker = a.isPrintedJoker || a.isWildJoker ? 1 : 0;
      const bJoker = b.isPrintedJoker || b.isWildJoker ? 1 : 0;
      if (aJoker !== bJoker) return aJoker - bJoker; // Never discard jokers
      return getCardPenalty(b.rank) - getCardPenalty(a.rank);
    });

    const toDiscard = sorted[0];
    this.discardCard(toDiscard.id);
  }

  /**
   * Helper algorithm to organize 13 cards into sequences and sets
   */
  autoGroupHand(handCards) {
    const hand = [...handCards];
    const wildRank = this.wildJoker?.rank;

    // Group cards by suit
    const suitGroups = {};
    for (const card of hand) {
      suitGroups[card.suit] = suitGroups[card.suit] || [];
      suitGroups[card.suit].push(card);
    }

    const groups = [];
    const usedIds = new Set();

    // 1. Extract pure sequences
    for (const suit in suitGroups) {
      const list = suitGroups[suit].sort((a, b) => a.num - b.num);
      for (let len = 5; len >= 3; len--) {
        for (let i = 0; i <= list.length - len; i++) {
          const slice = list.slice(i, i + len);
          if (slice.every((c) => !usedIds.has(c.id)) && isPureSequence(slice)) {
            groups.push(slice);
            slice.forEach((c) => usedIds.add(c.id));
          }
        }
      }
    }

    // 2. Extract sets and impure sequences from remaining cards
    const remaining = hand.filter((c) => !usedIds.has(c.id));
    const rankGroups = {};
    for (const card of remaining) {
      rankGroups[card.rank] = rankGroups[card.rank] || [];
      rankGroups[card.rank].push(card);
    }

    for (const rank in rankGroups) {
      const setCandidate = rankGroups[rank];
      if (setCandidate.length >= 3 && isValidSet(setCandidate, wildRank)) {
        groups.push(setCandidate);
        setCandidate.forEach((c) => usedIds.add(c.id));
      }
    }

    // 3. Cluster leftover cards into groups of 3-4 cards
    const leftover = hand.filter((c) => !usedIds.has(c.id));
    while (leftover.length > 0) {
      groups.push(leftover.splice(0, 4));
    }

    return groups.length > 0 ? groups : [hand];
  }

  isTerminal() {
    return {
      terminal: this.isMatchFinished,
      winner: this.matchWinner,
    };
  }

  getScore() {
    return {
      playerTotal: this.totalScores.player,
      botTotal: this.totalScores.bot,
      scoreLimit: this.scoreLimit,
    };
  }

  getState() {
    return {
      turn: this.turn,
      turnStep: this.turnStep,
      playerHand: [...this.playerHand],
      botCardCount: this.botHand.length,
      discardTop: this.discardPile[this.discardPile.length - 1] || null,
      stockCount: this.stockPile.length,
      wildJoker: this.wildJoker,
      isHandFinished: this.isHandFinished,
      isMatchFinished: this.isMatchFinished,
      matchWinner: this.matchWinner,
      result: this.result,
      totalScores: { ...this.totalScores },
      roundHistory: [...this.roundHistory],
      currentRound: this.currentRound,
      scoreLimit: this.scoreLimit,
    };
  }

  serialize() {
    return {
      totalScores: this.totalScores,
      currentRound: this.currentRound,
      scoreLimit: this.scoreLimit,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.totalScores = data.totalScores || { player: 0, bot: 0 };
    this.currentRound = data.currentRound || 1;
    this.scoreLimit = data.scoreLimit || 200;
  }
}

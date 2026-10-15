import { GameEngine } from '@/lib/engineInterface';
import { SeededRNG } from '@/lib/rng';

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const HAND_NAMES = {
  9: 'Royal Flush',
  8: 'Straight Flush',
  7: 'Four of a Kind',
  6: 'Full House',
  5: 'Flush',
  4: 'Straight',
  3: 'Three of a Kind',
  2: 'Two Pair',
  1: 'One Pair',
  0: 'High Card',
};

export function createDeck(rng = new SeededRNG()) {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${suit}-${rank}-${Math.random().toString(36).slice(2, 6)}`,
        suit,
        rank,
        value: RANK_VALUES[rank],
      });
    }
  }
  return rng.shuffle(cards);
}

/**
 * Evaluates the best 5-card poker hand from up to 7 cards.
 * Returns { category, name, kickers }
 */
export function evaluate7Cards(cards) {
  if (!cards || cards.length < 5) {
    return { category: 0, name: 'High Card', kickers: [] };
  }

  const combos = get5CardCombinations(cards);
  let best = null;

  for (const combo of combos) {
    const evaluated = evaluate5Cards(combo);
    if (!best || compareEvaluatedHands(evaluated, best) > 0) {
      best = evaluated;
    }
  }
  return best;
}

function get5CardCombinations(cards) {
  const n = cards.length;
  if (n === 5) return [cards];
  const results = [];

  function combine(start, chosen) {
    if (chosen.length === 5) {
      results.push([...chosen]);
      return;
    }
    for (let i = start; i < n; i++) {
      chosen.push(cards[i]);
      combine(i + 1, chosen);
      chosen.pop();
    }
  }

  combine(0, []);
  return results;
}

export function evaluate5Cards(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight (including 5-4-3-2-A wheel straight)
  let isStraight = false;
  let straightHigh = values[0];

  const uniqueValues = [...new Set(values)];
  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[0];
    } else if (
      uniqueValues[0] === 14 &&
      uniqueValues[1] === 5 &&
      uniqueValues[2] === 4 &&
      uniqueValues[3] === 3 &&
      uniqueValues[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5; // 5-high wheel straight
    }
  }

  // Rank counts
  const counts = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const countPairs = Object.entries(counts)
    .map(([val, count]) => ({ val: parseInt(val, 10), count }))
    .sort((a, b) => b.count - a.count || b.val - a.val);

  // 1. Royal / Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return { category: 9, name: HAND_NAMES[9], kickers: [14] };
    }
    return { category: 8, name: HAND_NAMES[8], kickers: [straightHigh] };
  }

  // 2. Four of a kind
  if (countPairs[0].count === 4) {
    return {
      category: 7,
      name: HAND_NAMES[7],
      kickers: [countPairs[0].val, countPairs[1].val],
    };
  }

  // 3. Full House
  if (countPairs[0].count === 3 && countPairs[1].count === 2) {
    return {
      category: 6,
      name: HAND_NAMES[6],
      kickers: [countPairs[0].val, countPairs[1].val],
    };
  }

  // 4. Flush
  if (isFlush) {
    return {
      category: 5,
      name: HAND_NAMES[5],
      kickers: values,
    };
  }

  // 5. Straight
  if (isStraight) {
    return {
      category: 4,
      name: HAND_NAMES[4],
      kickers: [straightHigh],
    };
  }

  // 6. Three of a kind
  if (countPairs[0].count === 3) {
    return {
      category: 3,
      name: HAND_NAMES[3],
      kickers: [countPairs[0].val, countPairs[1].val, countPairs[2].val],
    };
  }

  // 7. Two Pair
  if (countPairs[0].count === 2 && countPairs[1].count === 2) {
    return {
      category: 2,
      name: HAND_NAMES[2],
      kickers: [countPairs[0].val, countPairs[1].val, countPairs[2].val],
    };
  }

  // 8. One Pair
  if (countPairs[0].count === 2) {
    return {
      category: 1,
      name: HAND_NAMES[1],
      kickers: [
        countPairs[0].val,
        countPairs[1].val,
        countPairs[2].val,
        countPairs[3].val,
      ],
    };
  }

  // 9. High Card
  return {
    category: 0,
    name: HAND_NAMES[0],
    kickers: values,
  };
}

export function compareEvaluatedHands(h1, h2) {
  if (!h1 && !h2) return 0;
  if (!h1) return -1;
  if (!h2) return 1;
  if (h1.category !== h2.category) {
    return h1.category - h2.category;
  }
  for (let i = 0; i < Math.max(h1.kickers.length, h2.kickers.length); i++) {
    const k1 = h1.kickers[i] || 0;
    const k2 = h2.kickers[i] || 0;
    if (k1 !== k2) return k1 - k2;
  }
  return 0;
}

/**
 * Calculates main and side pots given each player's total contribution across the hand
 * and which players are still active (not folded).
 * Returns array of pots: [ { amount, eligiblePlayerIndices: [0, 1] }, ... ]
 */
export function calculatePots(totalContributions, foldedStatus) {
  // Collect non-zero contributions
  const activeEntries = totalContributions
    .map((amt, idx) => ({ idx, amt }))
    .filter((e) => e.amt > 0);

  if (activeEntries.length === 0) return [];

  // Unique sorted contribution thresholds
  const thresholds = [...new Set(activeEntries.map((e) => e.amt))].sort((a, b) => a - b);
  const pots = [];
  let prevThreshold = 0;

  for (const threshold of thresholds) {
    const tierDiff = threshold - prevThreshold;
    if (tierDiff <= 0) continue;

    let potAmount = 0;
    const eligibleIndices = [];

    for (let i = 0; i < totalContributions.length; i++) {
      if (totalContributions[i] >= threshold) {
        potAmount += tierDiff;
        if (!foldedStatus[i]) {
          eligibleIndices.push(i);
        }
      } else if (totalContributions[i] > prevThreshold) {
        potAmount += (totalContributions[i] - prevThreshold);
      }
    }

    if (potAmount > 0 && eligibleIndices.length > 0) {
      pots.push({
        amount: potAmount,
        eligible: eligibleIndices,
      });
    } else if (potAmount > 0 && eligibleIndices.length === 0) {
      // If nobody eligible in this tier (everyone folded), fold winner gets it
      const nonFolded = foldedStatus
        .map((f, i) => (!f ? i : -1))
        .filter((i) => i !== -1);
      if (nonFolded.length > 0) {
        pots.push({
          amount: potAmount,
          eligible: nonFolded,
        });
      }
    }

    prevThreshold = threshold;
  }

  return pots;
}

export class PokerEngine extends GameEngine {
  constructor(rng = new SeededRNG()) {
    super();
    this.rng = rng;
    this.smallBlind = 10;
    this.bigBlind = 20;

    // 3 players: Human (0), Bot 1 (1), Bot 2 (2)
    this.players = [
      { id: 'player', name: 'You', chips: 1000, isHuman: true },
      { id: 'bot1', name: 'Bot 1 (Bluff)', chips: 1000, isHuman: false },
      { id: 'bot2', name: 'Bot 2 (Tight)', chips: 1000, isHuman: false },
    ];

    this.dealerButtonIndex = -1; // Index of dealer button
    this.sbIndex = -1;
    this.bbIndex = -1;
    this.activeTurn = -1; // Player index whose turn it is

    this.street = 'preflop'; // 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'hand_over'
    this.pot = 0; // Total pot chips
    this.sidePots = []; // Computed pots

    this.currentBet = 0; // Highest bet to match in current street
    this.streetBets = [0, 0, 0]; // Chips put in current street
    this.totalHandBets = [0, 0, 0]; // Total chips put in entire hand for side pots
    this.folded = [false, false, false];
    this.allIn = [false, false, false];
    this.hasActed = [false, false, false]; // Track who acted in current street

    this.hands = [[], [], []];
    this.communityCards = [];
    this.deck = [];
    this.handResult = null;
    this.tournamentWinner = null;
  }

  init(config = {}) {
    this.players[0].chips = config.playerStack ?? 1000;
    this.players[1].chips = config.bot1Stack ?? 1000;
    this.players[2].chips = config.bot2Stack ?? 1000;
    this.dealerButtonIndex = -1;
    this.tournamentWinner = null;

    this.startHand();
    return this.getState();
  }

  /**
   * Helper to find next player who has chips (>0)
   */
  getNextAliveIndex(fromIndex) {
    const n = this.players.length;
    for (let step = 1; step <= n; step++) {
      const idx = (fromIndex + step) % n;
      if (this.players[idx].chips > 0) {
        return idx;
      }
    }
    return -1;
  }

  startHand() {
    // Check tournament termination first
    const alivePlayers = this.players.filter((p) => p.chips > 0);
    if (alivePlayers.length <= 1) {
      this.tournamentWinner = alivePlayers[0]?.id || 'nobody';
      this.street = 'hand_over';
      return;
    }

    // Check if human eliminated
    if (this.players[0].chips <= 0) {
      this.tournamentWinner = 'bots';
      this.street = 'hand_over';
      return;
    }

    this.deck = createDeck(this.rng);
    this.communityCards = [];
    this.street = 'preflop';
    this.handResult = null;

    // Reset hand state
    this.streetBets = [0, 0, 0];
    this.totalHandBets = [0, 0, 0];
    this.folded = [
      this.players[0].chips <= 0,
      this.players[1].chips <= 0,
      this.players[2].chips <= 0,
    ];
    this.allIn = [false, false, false];
    this.hasActed = [false, false, false];
    this.sidePots = [];

    // Deal 2 hole cards to each alive player
    this.hands = [[], [], []];
    for (let i = 0; i < 3; i++) {
      if (this.players[i].chips > 0) {
        this.hands[i] = [this.deck.pop(), this.deck.pop()];
      }
    }

    // Rotate dealer button among alive players
    if (this.dealerButtonIndex === -1) {
      this.dealerButtonIndex = this.players[0].chips > 0 ? 0 : this.getNextAliveIndex(0);
    } else {
      this.dealerButtonIndex = this.getNextAliveIndex(this.dealerButtonIndex);
    }

    // Determine Small Blind and Big Blind positions
    this.sbIndex = this.getNextAliveIndex(this.dealerButtonIndex);
    this.bbIndex = this.getNextAliveIndex(this.sbIndex);

    // Post Small Blind
    const sbPost = Math.min(this.smallBlind, this.players[this.sbIndex].chips);
    this.players[this.sbIndex].chips -= sbPost;
    this.streetBets[this.sbIndex] = sbPost;
    this.totalHandBets[this.sbIndex] = sbPost;
    if (this.players[this.sbIndex].chips === 0) {
      this.allIn[this.sbIndex] = true;
    }

    // Post Big Blind
    const bbPost = Math.min(this.bigBlind, this.players[this.bbIndex].chips);
    this.players[this.bbIndex].chips -= bbPost;
    this.streetBets[this.bbIndex] = bbPost;
    this.totalHandBets[this.bbIndex] = bbPost;
    if (this.players[this.bbIndex].chips === 0) {
      this.allIn[this.bbIndex] = true;
    }

    this.currentBet = Math.max(sbPost, bbPost);
    this.pot = sbPost + bbPost;

    // In 3-handed preflop, action begins after Big Blind (Under the Gun / Button)
    this.activeTurn = this.getNextAliveIndex(this.bbIndex);
  }

  getLegalActions(playerIndex = this.activeTurn) {
    if (this.street === 'showdown' || this.street === 'hand_over') return [];
    if (playerIndex !== this.activeTurn) return [];
    if (this.folded[playerIndex] || this.allIn[playerIndex]) return [];

    const stack = this.players[playerIndex].chips;
    const currentContribution = this.streetBets[playerIndex];
    const callCost = this.currentBet - currentContribution;

    const actions = ['fold'];

    if (callCost <= 0) {
      actions.push('check');
    } else {
      actions.push('call');
    }

    // Can raise if stack is greater than callCost
    if (stack > callCost) {
      actions.push('raise_2bb'); // Fixed 2x BB = 40 (or 2x currentBet)
      actions.push('raise_3bb'); // Fixed 3x BB = 60
      actions.push('all_in');
    } else if (stack > 0) {
      actions.push('all_in');
    }

    return actions;
  }

  applyAction(action) {
    // action: { type: 'fold'|'check'|'call'|'raise_2bb'|'raise_3bb'|'all_in'|'raise', amount }
    const actorIdx = this.activeTurn;
    if (actorIdx < 0 || this.folded[actorIdx] || this.allIn[actorIdx]) {
      return this.getState();
    }

    const currentContribution = this.streetBets[actorIdx];
    const callCost = this.currentBet - currentContribution;
    this.hasActed[actorIdx] = true;

    if (action.type === 'fold') {
      this.folded[actorIdx] = true;

      // Check if only 1 non-folded player remains
      const remaining = this.players
        .map((_, i) => i)
        .filter((i) => !this.folded[i] && this.players[i].chips + this.totalHandBets[i] > 0);

      if (remaining.length === 1) {
        this.resolveFoldWin(remaining[0]);
        return this.getState();
      }

      this.advanceBettingTurn();
      return this.getState();
    }

    if (action.type === 'check') {
      if (callCost > 0) {
        throw new Error('Cannot check facing a bet');
      }
      this.advanceBettingTurn();
      return this.getState();
    }

    if (action.type === 'call') {
      const pay = Math.min(callCost, this.players[actorIdx].chips);
      this.players[actorIdx].chips -= pay;
      this.streetBets[actorIdx] += pay;
      this.totalHandBets[actorIdx] += pay;
      this.pot += pay;

      if (this.players[actorIdx].chips === 0) {
        this.allIn[actorIdx] = true;
      }

      this.advanceBettingTurn();
      return this.getState();
    }

    if (action.type === 'raise_2bb' || action.type === 'raise_3bb' || action.type === 'raise') {
      let raiseTarget = this.currentBet + this.bigBlind * 2; // Default 2x BB raise
      if (action.type === 'raise_3bb') {
        raiseTarget = this.currentBet + this.bigBlind * 3;
      } else if (action.type === 'raise' && action.amount) {
        raiseTarget = action.amount;
      }

      const additional = Math.min(raiseTarget - currentContribution, this.players[actorIdx].chips);
      this.players[actorIdx].chips -= additional;
      this.streetBets[actorIdx] += additional;
      this.totalHandBets[actorIdx] += additional;
      this.pot += additional;

      if (this.streetBets[actorIdx] > this.currentBet) {
        this.currentBet = this.streetBets[actorIdx];
        // Others must respond to new raise
        for (let i = 0; i < 3; i++) {
          if (i !== actorIdx && !this.folded[i] && !this.allIn[i]) {
            this.hasActed[i] = false;
          }
        }
      }

      if (this.players[actorIdx].chips === 0) {
        this.allIn[actorIdx] = true;
      }

      this.advanceBettingTurn();
      return this.getState();
    }

    if (action.type === 'all_in') {
      const allInAmt = this.players[actorIdx].chips;
      this.players[actorIdx].chips = 0;
      this.streetBets[actorIdx] += allInAmt;
      this.totalHandBets[actorIdx] += allInAmt;
      this.pot += allInAmt;
      this.allIn[actorIdx] = true;

      if (this.streetBets[actorIdx] > this.currentBet) {
        this.currentBet = this.streetBets[actorIdx];
        // Re-open action for anyone who hasn't matched this new bet and is not all-in
        for (let i = 0; i < 3; i++) {
          if (i !== actorIdx && !this.folded[i] && !this.allIn[i]) {
            this.hasActed[i] = false;
          }
        }
      }

      this.advanceBettingTurn();
      return this.getState();
    }

    return this.getState();
  }

  advanceBettingTurn() {
    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.advanceStreet();
      return;
    }

    // Find next eligible active turn
    let nextIdx = (this.activeTurn + 1) % 3;
    for (let step = 0; step < 3; step++) {
      if (!this.folded[nextIdx] && !this.allIn[nextIdx] && this.players[nextIdx].chips > 0) {
        this.activeTurn = nextIdx;
        return;
      }
      nextIdx = (nextIdx + 1) % 3;
    }

    // If nobody else can act (everyone else all-in or folded), advance street
    this.advanceStreet();
  }

  isBettingRoundComplete() {
    // Active players who haven't folded
    const nonFolded = [0, 1, 2].filter((i) => !this.folded[i] && (this.players[i].chips > 0 || this.allIn[i]));

    // If 1 or fewer players can still act, round is complete when bets match
    const canAct = nonFolded.filter((i) => !this.allIn[i] && this.players[i].chips > 0);
    if (canAct.length <= 1) {
      // Check if all players who can act have matched current bet and acted
      const allMatched = nonFolded.every((i) => this.allIn[i] || this.streetBets[i] === this.currentBet);
      const allActed = canAct.every((i) => this.hasActed[i]);
      if (allMatched && (allActed || canAct.length === 0)) {
        return true;
      }
    }

    // In normal play: all active players must have acted AND their street bets must match currentBet (or they're all-in)
    const allHaveActed = canAct.every((i) => this.hasActed[i]);
    const allBetsMatched = nonFolded.every((i) => this.allIn[i] || this.streetBets[i] === this.currentBet);

    return allHaveActed && allBetsMatched;
  }

  advanceStreet() {
    // Reset street bets and acted flags
    this.streetBets = [0, 0, 0];
    this.currentBet = 0;
    this.hasActed = [false, false, false];

    // Compute active side pots up to current street
    this.sidePots = calculatePots(this.totalHandBets, this.folded);

    // If 2 or more players are all-in or only 1 player can act, fast-forward remaining cards to showdown
    const nonFolded = [0, 1, 2].filter((i) => !this.folded[i] && (this.players[i].chips > 0 || this.allIn[i]));
    const canAct = nonFolded.filter((i) => !this.allIn[i] && this.players[i].chips > 0);

    if (this.street === 'preflop') {
      this.street = 'flop';
      this.deck.pop(); // Burn
      this.communityCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
    } else if (this.street === 'flop') {
      this.street = 'turn';
      this.deck.pop(); // Burn
      this.communityCards.push(this.deck.pop());
    } else if (this.street === 'turn') {
      this.street = 'river';
      this.deck.pop(); // Burn
      this.communityCards.push(this.deck.pop());
    } else if (this.street === 'river') {
      this.resolveShowdown();
      return;
    }

    // If nobody can act post-flop, deal remaining community cards and go to showdown
    if (canAct.length <= 1) {
      while (this.communityCards.length < 5) {
        this.deck.pop(); // Burn
        this.communityCards.push(this.deck.pop());
      }
      this.resolveShowdown();
      return;
    }

    // First person to act post-flop is first alive, non-folded player to the left of the dealer
    let firstTurn = this.getNextAliveIndex(this.dealerButtonIndex);
    let attempts = 0;
    while ((this.folded[firstTurn] || this.allIn[firstTurn]) && attempts < 3) {
      firstTurn = this.getNextAliveIndex(firstTurn);
      attempts++;
    }
    this.activeTurn = firstTurn;
  }

  resolveFoldWin(winnerIdx) {
    this.street = 'hand_over';
    this.players[winnerIdx].chips += this.pot;

    this.handResult = {
      winnerId: this.players[winnerIdx].id,
      winnerName: this.players[winnerIdx].name,
      reason: 'fold',
      potWon: this.pot,
      evalDesc: 'Uncontested',
      potsAwarded: [{ amount: this.pot, winnerIndices: [winnerIdx] }],
    };

    this.checkTournamentEliminations();
  }

  resolveShowdown() {
    this.street = 'showdown';
    this.sidePots = calculatePots(this.totalHandBets, this.folded);

    // Evaluate hand for each non-folded player
    const evaluations = [0, 1, 2].map((idx) => {
      if (this.folded[idx]) return null;
      return evaluate7Cards([...this.hands[idx], ...this.communityCards]);
    });

    const potsAwarded = [];

    // Award each pot to the best hand among eligible players for that pot
    for (const pot of this.sidePots) {
      let bestScore = null;
      let winners = [];

      for (const eligibleIdx of pot.eligible) {
        const ev = evaluations[eligibleIdx];
        if (!ev) continue;

        if (bestScore === null) {
          bestScore = ev;
          winners = [eligibleIdx];
        } else {
          const comp = compareEvaluatedHands(ev, bestScore);
          if (comp > 0) {
            bestScore = ev;
            winners = [eligibleIdx];
          } else if (comp === 0) {
            winners.push(eligibleIdx);
          }
        }
      }

      // Split pot among winners
      const share = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount % winners.length;

      winners.forEach((wIdx, i) => {
        this.players[wIdx].chips += share + (i === 0 ? remainder : 0);
      });

      potsAwarded.push({
        amount: pot.amount,
        winnerIndices: winners,
      });
    }

    const topWinnerIdx = potsAwarded[0]?.winnerIndices[0] ?? 0;

    this.handResult = {
      winnerId: this.players[topWinnerIdx].id,
      winnerName: this.players[topWinnerIdx].name,
      reason: 'showdown',
      potWon: this.pot,
      evalDesc: evaluations[topWinnerIdx]?.name || 'High Card',
      evaluations: evaluations.map((e) => e?.name || ''),
      potsAwarded,
      isSplit: potsAwarded.some((p) => p.winnerIndices.length > 1),
    };

    this.checkTournamentEliminations();
  }

  checkTournamentEliminations() {
    if (this.players[0].chips <= 0) {
      this.tournamentWinner = 'bots';
    } else {
      const activeBots = [this.players[1], this.players[2]].filter((b) => b.chips > 0);
      if (activeBots.length === 0) {
        this.tournamentWinner = 'player';
      }
    }
  }

  /**
   * Fast, simple rule-based AI turn calculation (<10ms)
   */
  computeAiAction(playerIndex = this.activeTurn) {
    const legal = this.getLegalActions(playerIndex);
    if (!legal || legal.length === 0) return null;

    const cards = [...this.hands[playerIndex], ...this.communityCards];
    const ev = evaluate7Cards(cards);
    const rankCategory = ev.category; // 0: High Card, 1: Pair, 2: Two Pair, 3: Trips, 4+: Strong
    const callCost = this.currentBet - this.streetBets[playerIndex];

    const isBluffer = playerIndex === 1; // Bot 1 has higher bluff tendency

    // 1. Strong hands: Three of a kind or better -> Raise or All-in
    if (rankCategory >= 3) {
      if (legal.includes('raise_3bb') && Math.random() < 0.6) {
        return { type: 'raise_3bb' };
      }
      if (legal.includes('raise_2bb') && Math.random() < 0.8) {
        return { type: 'raise_2bb' };
      }
      return legal.includes('call') ? { type: 'call' } : { type: 'check' };
    }

    // 2. Medium hands: Pair or Two pair -> Call moderate bets or Raise 2bb
    if (rankCategory >= 1) {
      if (callCost <= this.bigBlind * 2) {
        if (legal.includes('raise_2bb') && Math.random() < 0.25) {
          return { type: 'raise_2bb' };
        }
        return legal.includes('call') ? { type: 'call' } : { type: 'check' };
      }
      if (callCost <= this.bigBlind * 4) {
        return legal.includes('call') ? { type: 'call' } : { type: 'fold' };
      }
      return Math.random() < 0.3 && legal.includes('call') ? { type: 'call' } : { type: 'fold' };
    }

    // 3. Weak hands: High card
    // Small bluff chance (10-15%)
    if (isBluffer && Math.random() < 0.12 && legal.includes('raise_2bb')) {
      return { type: 'raise_2bb' };
    }

    // If free to check, always check
    if (legal.includes('check')) {
      return { type: 'check' };
    }

    // Only call small blind or min call preflop
    if (callCost <= this.bigBlind && Math.random() < 0.25 && legal.includes('call')) {
      return { type: 'call' };
    }

    return { type: 'fold' };
  }

  isTerminal() {
    return {
      terminal: this.tournamentWinner !== null,
      winner: this.tournamentWinner,
    };
  }

  getScore() {
    return {
      playerStack: this.players[0].chips,
      bot1Stack: this.players[1].chips,
      bot2Stack: this.players[2].chips,
      pot: this.pot,
    };
  }

  getState() {
    const playerEval = evaluate7Cards([...this.hands[0], ...this.communityCards]);
    const isOver = this.street === 'showdown' || this.street === 'hand_over';

    return {
      street: this.street,
      pot: this.pot,
      sidePots: [...this.sidePots],
      currentBet: this.currentBet,
      dealerButtonIndex: this.dealerButtonIndex,
      activeTurn: this.activeTurn,
      players: this.players.map((p, idx) => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        isHuman: p.isHuman,
        streetBet: this.streetBets[idx],
        totalBet: this.totalHandBets[idx],
        folded: this.folded[idx],
        allIn: this.allIn[idx],
        isDealer: idx === this.dealerButtonIndex,
        isSB: idx === this.sbIndex,
        isBB: idx === this.bbIndex,
        hand: isOver || idx === 0
          ? [...this.hands[idx]]
          : this.hands[idx].map(() => ({ hidden: true })),
        evalName: isOver && !this.folded[idx]
          ? evaluate7Cards([...this.hands[idx], ...this.communityCards])?.name || ''
          : '',
      })),
      communityCards: [...this.communityCards],
      playerEvalName: playerEval?.name || '',
      legalActions: this.getLegalActions(0),
      handResult: this.handResult,
      tournamentWinner: this.tournamentWinner,
    };
  }

  serialize() {
    return {
      players: this.players.map((p) => ({ ...p })),
      dealerButtonIndex: this.dealerButtonIndex,
      tournamentWinner: this.tournamentWinner,
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.players) {
      this.players = data.players.map((p) => ({ ...p }));
    }
    this.dealerButtonIndex = data.dealerButtonIndex ?? 0;
    this.tournamentWinner = data.tournamentWinner ?? null;
  }
}

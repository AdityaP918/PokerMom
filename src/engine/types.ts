export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14;
export interface Card { rank: Rank; suit: Suit }
export type Stage = 'preflop'|'flop'|'turn'|'river'|'showdown'|'complete';
export type Mode = 'cash'|'tournament';
export type Assistance = 'learn'|'practice'|'play';
export type Difficulty = 'beginner'|'developing'|'challenging';
export type Personality = 'cautious'|'balanced'|'bold'|'deceptive'|'unpredictable';
export type ActionKind = 'fold'|'check'|'call'|'bet'|'raise'|'all-in';

export interface GameConfig {
  mode: Mode; playerCount: number; smallBlind: number; bigBlind: number;
  startingStack: number; assistance: Assistance; difficulty: Difficulty;
  sound: boolean; reducedMotion: boolean; largeText: boolean; tableUpdates: boolean;
}
export interface BotProfile { personality: Personality; difficulty: Difficulty }
export interface BotHandState { confidence: number; pressure: number; suspicion: number; bluffOpportunity: number }
export interface Player {
  id: string; name: string; isHuman: boolean; chips: number; startingChips: number;
  cards: Card[]; folded: boolean; allIn: boolean; eliminated: boolean;
  streetBet: number; totalBet: number; acted: boolean; potsWon: number; largestPot: number;
  profile?: BotProfile; botState?: BotHandState;
}
export interface GameAction { playerId: string; kind: ActionKind; amount: number; stage: Stage; text: string; review?: DecisionReview }
export interface GameState {
  version: 1; config: GameConfig; players: Player[]; deck: Card[]; board: Card[];
  dealer: number; currentPlayer: number; stage: Stage; currentBet: number; minRaise: number;
  pot: number; handNumber: number; blindLevel: number; handsAtLevel: number;
  actions: GameAction[]; message: string; handMessage?: string; winnerIds?: string[];
  initialBankroll: number; seed: number; sessionId: string;
}
export interface PlayerView {
  self: Readonly<Player>; board: readonly Card[]; pot: number; stage: Stage;
  currentBet: number; toCall: number; minRaise: number;
  opponents: ReadonlyArray<Pick<Player,'id'|'name'|'chips'|'folded'|'allIn'|'streetBet'|'totalBet'>>;
  actions: readonly GameAction[]; config: Readonly<GameConfig>;
}
export interface EvaluatedHand { category: number; name: string; values: number[]; cards: Card[]; plain: string }
export interface SituationAssessment {
  strength: number; potOdds: number; toCall: number; drawPotential: number;
  position: number; stackPressure: number; aggression: number;
}
export interface BotDecision {
  kind: ActionKind; amount: number; weights: Record<string,number>;
  explanation: string; assessment: SituationAssessment;
}
export interface DecisionReview { label: 'reasonable'|'risky'|'costly'; reason: string; outcome?: string }
export interface NotebookPlayer { id:string; name:string; cards:Card[]; folded:boolean; isWinner:boolean; handName:string; handPlain:string }
export interface NotebookEntry {
  id: string; date: string; title: string; summary: string; cards: Card[]; board: Card[];
  result?: string; players?: NotebookPlayer[]; actions?: GameAction[]; review?: DecisionReview;
}

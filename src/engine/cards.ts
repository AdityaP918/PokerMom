import type { Card, Rank, Suit } from './types';

export const suits: Suit[] = ['clubs','diamonds','hearts','spades'];
export const ranks: Rank[] = [2,3,4,5,6,7,8,9,10,11,12,13,14];
const longFaces:Partial<Record<Rank,string>>={11:'Jack',12:'Queen',13:'King',14:'Ace'};
const shortFaces:Partial<Record<Rank,string>>={11:'J',12:'Q',13:'K',14:'A'};
export const rankName = (rank: Rank) => longFaces[rank] ?? String(rank);
export const shortRank = (rank: Rank) => shortFaces[rank] ?? String(rank);
export const suitSymbol = (suit: Suit) => ({clubs:'♣',diamonds:'♦',hearts:'♥',spades:'♠'}[suit]);
export const cardText = (card: Card) => `${rankName(card.rank)} of ${card.suit}`;
export const makeDeck = (): Card[] => suits.flatMap(suit => ranks.map(rank => ({rank,suit})));

export function nextRandom(seed: number): [number,number] {
  let x = seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return [(x >>> 0) / 4294967296, x >>> 0];
}
export function shuffle(deck: Card[], seed: number): [Card[],number] {
  const out = [...deck]; let current = seed;
  for (let i=out.length-1;i>0;i--) { const [r,n] = nextRandom(current); current=n; const j=Math.floor(r*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
  return [out,current];
}

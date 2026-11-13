import type { Card, EvaluatedHand, Rank } from './types';
import { rankName } from './cards';

const names = ['High Card','One Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush'];
const combos = <T,>(a:T[],n:number):T[][] => n===0?[[]]:a.flatMap((x,i)=>combos(a.slice(i+1),n-1).map(c=>[x,...c]));

function five(cards: Card[]): EvaluatedHand {
  const sorted=[...cards].sort((a,b)=>b.rank-a.rank);
  const groups=new Map<number,Card[]>(); for(const c of sorted) groups.set(c.rank,[...(groups.get(c.rank)||[]),c]);
  const counts=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length||b[0]-a[0]);
  const flush=cards.every(c=>c.suit===cards[0].suit);
  const unique:number[]=[...new Set(sorted.map(c=>c.rank))]; if(unique[0]===14) unique.push(1);
  let straightHigh=0; for(let i=0;i<=unique.length-5;i++) if(unique[i]-unique[i+4]===4) { straightHigh=unique[i]; break; }
  let category=0, values:number[]=sorted.map(c=>c.rank), ordered=sorted;
  if(flush&&straightHigh){ category=8;values=[straightHigh]; }
  else if(counts[0][1].length===4){category=7;values=[counts[0][0],counts[1][0]];ordered=[...counts[0][1],...counts[1][1]];}
  else if(counts[0][1].length===3&&counts[1][1].length===2){category=6;values=[counts[0][0],counts[1][0]];ordered=[...counts[0][1],...counts[1][1]];}
  else if(flush){category=5;}
  else if(straightHigh){category=4;values=[straightHigh];}
  else if(counts[0][1].length===3){category=3;values=[counts[0][0],...counts.slice(1).map(g=>g[0]).sort((a,b)=>b-a)];ordered=counts.flatMap(g=>g[1]);}
  else if(counts[0][1].length===2&&counts[1][1].length===2){category=2;const pairs=[counts[0][0],counts[1][0]].sort((a,b)=>b-a);values=[...pairs,counts[2][0]];ordered=[...groups.get(pairs[0])!,...groups.get(pairs[1])!,...counts[2][1]];}
  else if(counts[0][1].length===2){category=1;values=[counts[0][0],...counts.slice(1).map(g=>g[0]).sort((a,b)=>b-a)];ordered=counts.flatMap(g=>g[1]);}
  const high=values[0] as Rank;
  const royal=category===8&&straightHigh===14;
  const name=royal?'Royal Flush':names[category];
  const plain=category===0?`${rankName(high)} is your highest card.`:
    category===1?`You have one pair of ${rankName(high)}s.`:
    category===2?`You have two pairs: ${rankName(values[0] as Rank)}s and ${rankName(values[1] as Rank)}s.`:
    category===3?`You have three ${rankName(high)}s.`:
    category===4?`You have five cards in order, ending at ${rankName(high)}.`:
    category===5?`You have five cards of the same suit.`:
    category===6?`You have three ${rankName(high)}s plus a pair.`:
    category===7?`You have all four ${rankName(high)}s.`:
    royal?'You have the strongest possible hand: 10 through Ace in one suit.':'You have five cards in order, all in one suit.';
  return {category,name,values,cards:ordered,plain};
}
export function compareHands(a:EvaluatedHand,b:EvaluatedHand){ if(a.category!==b.category)return a.category-b.category; for(let i=0;i<Math.max(a.values.length,b.values.length);i++){const d=(a.values[i]||0)-(b.values[i]||0);if(d)return d;}return 0; }
export function evaluate(cards:Card[]):EvaluatedHand { if(cards.length<5){const high=[...cards].sort((a,b)=>b.rank-a.rank)[0];return {category:0,name:'High Card',values:high?[high.rank]:[],cards:[...cards],plain:high?`${rankName(high.rank)} is your highest card.`:'No hand yet.'};} return combos(cards,5).map(five).sort((a,b)=>compareHands(b,a))[0]; }

import { useState } from 'preact/hooks';
import { Card } from './Card';
import { makeDeck, shuffle } from '../engine/cards';
import { compareHands, evaluate } from '../engine/evaluator';
import type { Card as PlayingCard, Rank, Suit } from '../engine/types';

const c=(rank:Rank,suit:Suit):PlayingCard=>({rank,suit});
const hands=[
  ['Royal Flush',100,'10 through Ace, all in one suit. The strongest hand.',[c(10,'hearts'),c(11,'hearts'),c(12,'hearts'),c(13,'hearts'),c(14,'hearts')]],
  ['Straight Flush',90,'Five cards in order, all in one suit.',[c(5,'clubs'),c(6,'clubs'),c(7,'clubs'),c(8,'clubs'),c(9,'clubs')]],
  ['Four of a Kind',80,'All four cards of one number or picture.',[c(8,'clubs'),c(8,'diamonds'),c(8,'hearts'),c(8,'spades'),c(13,'clubs')]],
  ['Full House',70,'Three matching cards plus a separate pair.',[c(12,'clubs'),c(12,'hearts'),c(12,'spades'),c(4,'clubs'),c(4,'diamonds')]],
  ['Flush',60,'Five cards of one suit; they need not be in order.',[c(14,'diamonds'),c(11,'diamonds'),c(8,'diamonds'),c(5,'diamonds'),c(2,'diamonds')]],
  ['Straight',50,'Five cards in order; suits may be different.',[c(6,'clubs'),c(7,'hearts'),c(8,'diamonds'),c(9,'spades'),c(10,'clubs')]],
  ['Three of a Kind',40,'Three cards of the same number or picture.',[c(7,'clubs'),c(7,'diamonds'),c(7,'spades'),c(13,'hearts'),c(3,'clubs')]],
  ['Two Pair',30,'Two different pairs.',[c(14,'clubs'),c(14,'hearts'),c(5,'diamonds'),c(5,'spades'),c(10,'clubs')]],
  ['One Pair',20,'Two cards of the same number or picture.',[c(11,'clubs'),c(11,'diamonds'),c(14,'hearts'),c(8,'spades'),c(3,'clubs')]],
  ['High Card',10,'No combination; the highest card leads.',[c(14,'clubs'),c(11,'diamonds'),c(8,'hearts'),c(5,'spades'),c(2,'clubs')]]
] as const;

const patternCards=[5,5,4,5,5,5,3,4,2,1];
export function Guide({onClose,floating=false}:{onClose:()=>void;floating?:boolean}){return <div class={floating?'reference-layer':'overlay'}><section class={`dialog guide ${floating?'floating-guide':''}`} role="dialog" aria-modal={!floating} aria-labelledby="guide-title"><button class="close" onClick={onClose} aria-label="Close guide">×</button><p class="eyebrow">Strongest to weakest</p><h2 id="guide-title">The ten poker hands</h2><p>Gold cards make the named pattern. The points show which hand ranks higher.</p><div class="graphic-hand-list">{hands.map((hand,i)=><article><div class="rank-number">{i+1}</div><div class="hand-copy"><strong>{hand[0]}</strong><span>{hand[1]} strength points</span><p>{hand[2]}</p></div><div class="example-cards">{hand[3].map((card,j)=><Card card={card} small highlight={j<patternCards[i]}/>)}</div></article>)}</div></section></div>}

type RandomDeal={you:PlayingCard[];opponent:PlayingCard[];board:PlayingCard[];correct:number;explanation:string};
function randomDeal():RandomDeal{let deck;[deck]=shuffle(makeDeck(),(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);const you=[deck.pop()!,deck.pop()!],opponent=[deck.pop()!,deck.pop()!],board=[deck.pop()!,deck.pop()!,deck.pop()!,deck.pop()!,deck.pop()!];const yours=evaluate([...you,...board]),theirs=evaluate([...opponent,...board]),comparison=compareHands(yours,theirs);const boardPlays=yours.cards.every(card=>board.some(b=>b.rank===card.rank&&b.suit===card.suit))&&theirs.cards.every(card=>board.some(b=>b.rank===card.rank&&b.suit===card.suit));const correct=comparison>0?0:comparison<0?1:2;const explanation=correct===0?`You win with ${yours.name}. ${yours.plain} The opponent has ${theirs.name}.`:correct===1?`The opponent wins with ${theirs.name}. ${theirs.plain} You have ${yours.name}.`:boardPlays?`Split pot. The five shared cards already make the best hand: ${yours.name}. Both players use those same five cards. The dealer does not play a hand.`:`Split pot. You both make the same-strength ${yours.name}, including all tie-breaking cards.`;return {you,opponent,board,correct,explanation}}

export function WhoWins({onClose}:{onClose:()=>void}){const [deal,setDeal]=useState<RandomDeal>(randomDeal),[answer,setAnswer]=useState<number|null>(null);const next=()=>{setDeal(randomDeal());setAnswer(null)};const answers=['You win','Opponent wins','Split pot'];return <div class="overlay"><section class="dialog scenario-dialog" role="dialog" aria-modal="true"><button class="close" onClick={onClose}>×</button><p class="eyebrow">Random real-table practice</p><h2>Who wins this deal?</h2><p>Use the strongest five-card hand available from each player’s private cards and the shared cards. The dealer is not another player.</p><div class="scenario-table"><PlayerCards label="Your cards" cards={deal.you}/><div class="scenario-board"><span>Shared cards</span><div class="example-cards">{deal.board.map(card=><Card card={card} small/>)}</div></div><PlayerCards label="Opponent" cards={deal.opponent}/></div><div class="scenario-answers three">{answers.map((choice,i)=><button class={answer===i?(i===deal.correct?'correct':'incorrect'):''} onClick={()=>setAnswer(i)}>{choice}</button>)}</div>{answer!==null&&<div class={`scenario-result ${answer===deal.correct?'good':'warm'}`}><strong>{answer===deal.correct?'Correct.':'Look again.'}</strong><p>{deal.explanation}</p><button class="primary" onClick={next}>Deal another random hand</button></div>}</section></div>}
function PlayerCards({label,cards}:{label:string;cards:PlayingCard[]}){return <div class="scenario-player"><strong>{label}</strong><div class="example-cards">{cards.map(card=><Card card={card}/>)}</div></div>}

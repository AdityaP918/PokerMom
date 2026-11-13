import type { Card as PlayingCard } from '../engine/types';
import { shortRank, suitSymbol } from '../engine/cards';

export function Card({card,hidden=false,small=false,highlight=false}:{card?:PlayingCard;hidden?:boolean;small?:boolean;highlight?:boolean}){
  if(hidden||!card)return <div class={`card back ${small?'small':''}`} aria-label="Hidden card"><span class="card-back-mark">♠</span><small>PM</small></div>;
  const red=card.suit==='hearts'||card.suit==='diamonds';
  return <div class={`card ${red?'red':'black'} ${small?'small':''} ${highlight?'winning-card':''}`} aria-label={`${shortRank(card.rank)} of ${card.suit}${highlight?', part of the winning hand':''}`}>
    <span>{shortRank(card.rank)}</span><span class="suit">{suitSymbol(card.suit)}</span>
  </div>;
}

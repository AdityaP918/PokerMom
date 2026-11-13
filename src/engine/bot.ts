import { evaluate } from './evaluator';
import { nextRandom } from './cards';
import type { ActionKind, BotDecision, BotHandState, BotProfile, Personality, PlayerView, SituationAssessment } from './types';

export const personalities: Personality[]=['cautious','balanced','bold','deceptive','unpredictable'];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

export function newBotProfile(difficulty:BotProfile['difficulty'],seed:number):[BotProfile,number]{
  const [r,next]=nextRandom(seed); return [{personality:personalities[Math.floor(r*personalities.length)],difficulty},next];
}
export const freshBotState=():BotHandState=>({confidence:.35,pressure:.1,suspicion:.1,bluffOpportunity:.1});

export function assess(view:PlayerView):SituationAssessment{
  const hand=evaluate([...view.self.cards,...view.board]);
  const rankBoost=(hand.values[0]||2)/14;
  const pocketPair=view.stage==='preflop'&&view.self.cards.length===2&&view.self.cards[0].rank===view.self.cards[1].rank;
  const strength=clamp(hand.category/8*.86+rankBoost*.14+(pocketPair?.1:0));
  const toCall=view.toCall;
  const potOdds=toCall<=0?0:toCall/(view.pot+toCall);
  const ranks=view.self.cards.map(c=>c.rank);
  const sameSuit=view.self.cards.length===2&&view.self.cards[0].suit===view.self.cards[1].suit;
  const close=ranks.length===2&&Math.abs(ranks[0]-ranks[1])<=2;
  const drawPotential=clamp((sameSuit?.28:0)+(close?.22:0)+(hand.category>=4?.2:0));
  const live=view.opponents.filter(p=>!p.folded).length;
  const position=clamp(1-live/Math.max(1,view.opponents.length));
  const stackPressure=clamp(toCall/Math.max(1,view.self.chips)+(view.config.mode==='tournament'&&view.self.chips<view.config.bigBlind*10?.3:0));
  const recent=view.actions.slice(-5); const aggression=clamp(recent.filter(a=>a.kind==='raise'||a.kind==='bet'||a.kind==='all-in').length/3);
  return {strength,potOdds,toCall,drawPotential,position,stackPressure,aggression};
}

export function evolveBotState(old:BotHandState,a:SituationAssessment,profile:BotProfile):BotHandState{
  const bold=profile.personality==='bold'? .14:profile.personality==='cautious'?-.12:0;
  return {
    confidence:clamp(old.confidence*.55+(a.strength+a.drawPotential*.3)*.45+bold),
    pressure:clamp(old.pressure*.5+(a.stackPressure+a.aggression*.35)*.5),
    suspicion:clamp(old.suspicion*.6+a.aggression*.4),
    bluffOpportunity:clamp(old.bluffOpportunity*.4+(a.position*(1-a.aggression))*.6+(profile.personality==='deceptive'?.18:0))
  };
}

export function decide(view:PlayerView,profile:BotProfile,state:BotHandState,seed:number):[BotDecision,BotHandState,number]{
  const a=assess(view), evolved=evolveBotState(state,a,profile);
  const [random,next]=nextRandom(seed);
  const noise={beginner:.25,developing:.14,challenging:.07}[profile.difficulty];
  const temperament=profile.personality==='cautious'?-.12:profile.personality==='bold'?.12:profile.personality==='unpredictable'?(random-.5)*.3:0;
  const score=clamp(a.strength*.65+a.drawPotential*.12+evolved.confidence*.18+evolved.bluffOpportunity*.12+temperament+(random-.5)*noise-evolved.pressure*.12);
  const canCheck=a.toCall===0, callThreshold=a.potOdds+(profile.difficulty==='beginner'?.08:0);
  let kind:ActionKind,amount=0;
  if(!canCheck&&score<callThreshold){kind='fold';}
  else if(score>.93){kind='all-in';amount=view.self.chips;}
  else if(score>.74&&view.self.chips>view.toCall){kind=view.currentBet?'raise':'bet';amount=Math.min(view.self.chips,Math.max(view.currentBet+view.minRaise,Math.round((view.pot*.55+view.toCall)/view.config.bigBlind)*view.config.bigBlind));}
  else {kind=canCheck?'check':'call';amount=canCheck?0:Math.min(view.toCall,view.self.chips);}
  const weights={strength:a.strength,price:1-a.potOdds,confidence:evolved.confidence,pressure:1-evolved.pressure,bluff:evolved.bluffOpportunity,random};
  const explanation=`${profile.personality} baseline; hand strength ${Math.round(a.strength*100)}%; continuing costs $${a.toCall}; confidence ${Math.round(evolved.confidence*100)}%.`;
  return [{kind,amount,weights,explanation,assessment:a},evolved,next];
}

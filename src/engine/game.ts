import { makeDeck, shuffle } from './cards';
import { compareHands, evaluate } from './evaluator';
import { assess, freshBotState, newBotProfile } from './bot';
import type { ActionKind, GameAction, GameConfig, GameState, Player, PlayerView } from './types';

const BOT_NAMES=['Adi','Rover','Kiaan','Sofia','Theo','Yuki','Hana','Luca','Maya','Noah','Anika','Emil'];
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
const active=(p:Player)=>!p.eliminated&&p.chips>0;
const inHand=(p:Player)=>!p.eliminated&&!p.folded;
const nextSeat=(s:GameState,from:number,predicate:(p:Player)=>boolean=active)=>{for(let n=1;n<=s.players.length;n++){const i=(from+n)%s.players.length;if(predicate(s.players[i]))return i;}return from;};

export const defaultConfig:GameConfig={mode:'cash',playerCount:4,smallBlind:1,bigBlind:2,startingStack:200,assistance:'learn',difficulty:'beginner',sound:true,reducedMotion:false,largeText:true,tableUpdates:true,tableColor:'green'};

export function createGame(config:GameConfig,seed=Date.now()>>>0):GameState{
  const players:Player[]=Array.from({length:config.playerCount},(_,i)=>({id:i===0?'meena':`bot-${i}`,name:i===0?'Meena':BOT_NAMES[i-1],isHuman:i===0,chips:config.startingStack,startingChips:config.startingStack,cards:[],folded:false,allIn:false,eliminated:false,streetBet:0,totalBet:0,acted:false,potsWon:0,largestPot:0}));
  const state:GameState={version:1,config:{...config},players,deck:[],board:[],dealer:players.length-1,currentPlayer:0,stage:'complete',currentBet:0,minRaise:config.bigBlind,pot:0,handNumber:0,blindLevel:1,handsAtLevel:0,actions:[],message:'Welcome to PokerMom.',initialBankroll:players.length*config.startingStack,seed,sessionId:`${Date.now()}-${seed}`};
  return startHand(state);
}

function pay(p:Player,amount:number){const paid=Math.min(p.chips,Math.max(0,amount));p.chips-=paid;p.streetBet+=paid;p.totalBet+=paid;if(p.chips===0)p.allIn=true;return paid;}
function post(s:GameState,index:number,amount:number,label:string){const paid=pay(s.players[index],amount);s.actions.push({playerId:s.players[index].id,kind:'bet',amount:paid,stage:'preflop',text:`${s.players[index].name} posts ${label} $${paid}.`});}

export function startHand(input:GameState):GameState{
  const s=clone(input); s.handNumber++;s.handsAtLevel++;
  if(s.config.mode==='tournament'&&s.handsAtLevel>3){s.blindLevel++;s.handsAtLevel=1;s.config.smallBlind*=2;s.config.bigBlind*=2;}
  for(const p of s.players){if(s.config.mode==='tournament'&&p.chips===0)p.eliminated=true;p.cards=[];p.folded=p.eliminated;p.allIn=false;p.streetBet=0;p.totalBet=0;p.acted=false;}
  if(s.players.filter(active).length<2){s.stage='complete';return s;}
  s.dealer=nextSeat(s,s.dealer);s.board=[];s.pot=0;s.stage='preflop';s.currentBet=0;s.minRaise=s.config.bigBlind;s.actions=[];s.winnerIds=undefined;s.handMessage=undefined;
  let deck;[deck,s.seed]=shuffle(makeDeck(),s.seed);s.deck=deck;
  const seats=s.players.map((p,i)=>active(p)?i:-1).filter(i=>i>=0);
  for(let round=0;round<2;round++)for(const i of seats)s.players[i].cards.push(s.deck.pop()!);
  for(const p of s.players.filter(p=>!p.isHuman&&active(p))){[p.profile,s.seed]=newBotProfile(s.config.difficulty,s.seed);p.botState=freshBotState();}
  const heads=seats.length===2; const sb=heads?s.dealer:nextSeat(s,s.dealer);const bb=nextSeat(s,sb);
  post(s,sb,s.config.smallBlind,'small blind');post(s,bb,s.config.bigBlind,'big blind');s.currentBet=Math.max(...s.players.map(p=>p.streetBet));
  s.currentPlayer=nextSeat(s,bb,p=>inHand(p)&&!p.allIn);s.message=`Hand ${s.handNumber}. It is ${s.players[s.currentPlayer].name}'s turn.`;
  return s;
}

export function playerView(s:GameState,index:number):PlayerView{
  const self=clone(s.players[index]);
  return {self,board:clone(s.board),pot:s.pot+s.players.reduce((n,p)=>n+p.totalBet,0),stage:s.stage,currentBet:s.currentBet,toCall:Math.max(0,s.currentBet-self.streetBet),minRaise:s.minRaise,opponents:s.players.filter((_,i)=>i!==index).map(({id,name,chips,folded,allIn,streetBet,totalBet})=>({id,name,chips,folded,allIn,streetBet,totalBet})),actions:clone(s.actions),config:clone(s.config)};
}
export function legalActions(s:GameState,index=s.currentPlayer):ActionKind[]{const p=s.players[index];if(s.stage==='complete'||p.folded||p.allIn)return[];const call=s.currentBet-p.streetBet;return call>0?['fold','call',...(p.chips>call?['raise' as const,'all-in' as const]:['all-in' as const])]:['fold','check',...(p.chips>0?[s.currentBet?'raise' as const:'bet' as const,'all-in' as const]:[])];}

function actionText(p:Player,kind:ActionKind,paid:number){return kind==='fold'?`${p.name} folds.`:kind==='check'?`${p.name} checks.`:kind==='call'?`${p.name} calls $${paid}.`:kind==='bet'?`${p.name} bets $${p.streetBet}.`:`${p.name} ${kind==='all-in'?'goes all-in for':'raises to'} $${p.streetBet}.`;}
export function applyAction(input:GameState,index:number,kind:ActionKind,amount=0):GameState{
  const s=clone(input);if(index!==s.currentPlayer||!legalActions(s,index).includes(kind))return s;
  const p=s.players[index],before=p.streetBet;let paid=0;
  const situation=p.isHuman?assess(playerView(s,index)):null;
  if(kind==='fold')p.folded=true;
  else if(kind==='check'){}
  else if(kind==='call')paid=pay(p,s.currentBet-p.streetBet);
  else if(kind==='all-in')paid=pay(p,p.chips);
  else {const target=Math.max(s.currentBet+s.minRaise,amount||s.currentBet+s.minRaise);paid=pay(p,target-p.streetBet);}
  if(p.streetBet>s.currentBet){s.minRaise=Math.max(s.config.bigBlind,p.streetBet-s.currentBet);s.currentBet=p.streetBet;for(const q of s.players)if(q.id!==p.id&&!q.folded&&!q.allIn)q.acted=false;}
  p.acted=true;const text=actionText(p,kind,paid);
  const review=situation?reviewDecision(kind,situation.strength+situation.drawPotential*.25,situation.potOdds,situation.toCall):undefined;
  s.actions.push({playerId:p.id,kind,amount:paid,stage:s.stage,text,review});s.message=text;
  return advance(s,index);
}

function reviewDecision(kind:ActionKind,strength:number,potOdds:number,toCall:number){
  if(kind==='fold'){
    if(toCall===0)return {label:'costly' as const,reason:'You could have stayed in the hand for free. Checking would preserve that chance.'};
    if(strength>potOdds+.28)return {label:'risky' as const,reason:'Your cards appeared strong enough for the price. Folding may have given up too much.'};
    return {label:'reasonable' as const,reason:'The price was high compared with the strength and improvement chances visible at the time.'};
  }
  if(kind==='call')return strength+.12>=potOdds?{label:'reasonable' as const,reason:'The price to continue was supported by your current hand and improvement chances.'}:{label:'risky' as const,reason:'The cost to continue was high compared with your visible chances.'};
  if(kind==='raise'||kind==='bet'||kind==='all-in')return strength>.58?{label:'reasonable' as const,reason:'Applying pressure was supported by a strong visible hand.'}:{label:'risky' as const,reason:'This applied pressure with limited visible hand strength. It may work, but carries extra risk.'};
  return {label:'reasonable' as const,reason:'Checking kept you in the hand without adding money.'};
}

function roundDone(s:GameState){const able=s.players.filter(p=>inHand(p)&&!p.allIn);return able.every(p=>p.acted&&p.streetBet===s.currentBet);}
function advance(s:GameState,from:number):GameState{
  const contenders=s.players.filter(inHand);if(contenders.length===1)return awardUncontested(s,contenders[0]);
  if(roundDone(s))return nextStage(s);
  s.currentPlayer=nextSeat(s,from,p=>inHand(p)&&!p.allIn);s.message+=` ${s.players[s.currentPlayer].name} is next.`;return s;
}
function nextStage(s:GameState):GameState{
  for(const p of s.players){p.streetBet=0;p.acted=false;}s.currentBet=0;s.minRaise=s.config.bigBlind;
  const able=s.players.filter(p=>inHand(p)&&!p.allIn);
  if(s.stage==='preflop'){s.deck.pop();s.board.push(s.deck.pop()!,s.deck.pop()!,s.deck.pop()!);s.stage='flop';}
  else if(s.stage==='flop'){s.deck.pop();s.board.push(s.deck.pop()!);s.stage='turn';}
  else if(s.stage==='turn'){s.deck.pop();s.board.push(s.deck.pop()!);s.stage='river';}
  else return showdown(s);
  if(able.length<2)return nextStage(s);
  s.currentPlayer=nextSeat(s,s.dealer,p=>inHand(p)&&!p.allIn);s.message=`The ${s.stage} is dealt. ${s.players[s.currentPlayer].name} acts first.`;return s;
}
function collectBets(s:GameState){s.pot+=s.players.reduce((n,p)=>n+p.totalBet,0);for(const p of s.players)p.totalBet=0;}
function awardUncontested(s:GameState,winner:Player){collectBets(s);winner.chips+=s.pot;winner.potsWon++;winner.largestPot=Math.max(winner.largestPot,s.pot);s.winnerIds=[winner.id];s.handMessage=`${winner.name} wins $${s.pot}; everyone else folded.`;s.pot=0;s.stage='complete';return s;}
function showdown(s:GameState):GameState{
  const levels=[...new Set(s.players.map(p=>p.totalBet).filter(n=>n>0))].sort((a,b)=>a-b);let previous=0;const winnings=new Map<string,number>();
  for(const level of levels){const contributors=s.players.filter(p=>p.totalBet>=level);const amount=(level-previous)*contributors.length;previous=level;const eligible=contributors.filter(inHand);if(!eligible.length)continue;const ranked=eligible.map(p=>({p,h:evaluate([...p.cards,...s.board])}));const best=ranked.reduce((a,b)=>compareHands(a.h,b.h)>=0?a:b).h;const winners=ranked.filter(x=>compareHands(x.h,best)===0).map(x=>x.p);const share=Math.floor(amount/winners.length);let remainder=amount-share*winners.length;for(const w of winners)winnings.set(w.id,(winnings.get(w.id)||0)+share+(remainder-->0?1:0));}
  for(const [id,amount] of winnings){const p=s.players.find(x=>x.id===id)!;p.chips+=amount;p.potsWon++;p.largestPot=Math.max(p.largestPot,amount);}
  const ids=[...winnings.keys()];s.winnerIds=ids;s.stage='complete';s.handMessage=ids.map(id=>{const p=s.players.find(x=>x.id===id)!;return `${p.name} wins $${winnings.get(id)} with ${evaluate([...p.cards,...s.board]).name}.`;}).join(' ');for(const p of s.players)p.totalBet=0;s.pot=0;return s;
}
export function refill(input:GameState,index:number):GameState{const s=clone(input);if(s.config.mode==='cash'&&s.players[index].chips===0){s.players[index].chips=s.config.startingStack;s.players[index].startingChips+=s.config.startingStack;s.players[index].eliminated=false;}return s;}
export function sessionWinner(s:GameState):Player{return [...s.players].sort((a,b)=>(b.chips-b.startingChips)-(a.chips-a.startingChips)||b.potsWon-a.potsWon||b.largestPot-a.largestPot)[0];}

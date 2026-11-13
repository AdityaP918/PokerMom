import { describe,expect,it } from 'vitest';
import { applyAction,createGame,legalActions,playerView } from './game';
import { decide } from './bot';
import type { GameConfig } from './types';

const config:GameConfig={mode:'cash',playerCount:4,smallBlind:1,bigBlind:2,startingStack:200,assistance:'learn',difficulty:'challenging',sound:false,reducedMotion:true,largeText:true,tableUpdates:true,tableColor:'green'};

describe('fair game state',()=>{
  it('gives a bot view no deck or opponent hole cards',()=>{
    const game=createGame(config,42);const view=playerView(game,1);
    expect('deck' in view).toBe(false);
    expect(view.opponents.every(p=>!('cards' in p))).toBe(true);
    expect(view.self.cards).toHaveLength(2);
  });
  it('keeps personality independent from card identity for a seeded hand',()=>{
    const a=createGame(config,123),b=createGame(config,123);
    expect(a.players[1].profile).toEqual(b.players[1].profile);
    expect(a.players[1].cards).toEqual(b.players[1].cards);
  });
  it('evolves temporary state from the visible situation',()=>{
    const game=createGame(config,7);const bot=game.players[1];const [decision,next]=decide(playerView(game,1),bot.profile!,bot.botState!,99);
    expect(decision.explanation).toContain('continuing costs');
    expect(next).not.toEqual(bot.botState);
  });
  it('conserves chips after a legal action',()=>{
    let game=createGame(config,8);const before=game.players.reduce((n,p)=>n+p.chips+p.totalBet,0);
    const kind=legalActions(game,game.currentPlayer)[0];game=applyAction(game,game.currentPlayer,kind);
    expect(game.players.reduce((n,p)=>n+p.chips+p.totalBet,0)+game.pot).toBe(before);
  });
  it('serialises and restores exactly',()=>{const game=createGame(config,77);expect(JSON.parse(JSON.stringify(game))).toEqual(game)});
  it('allows Meena to fold even when checking is free',()=>{
    const game=createGame(config,81);game.currentPlayer=0;game.currentBet=game.players[0].streetBet;
    expect(legalActions(game,0)).toContain('fold');
  });
  it('honours a chosen raise total above the minimum',()=>{
    const game=createGame(config,91);game.currentPlayer=0;game.players[0].folded=false;game.players[0].allIn=false;
    const raised=applyAction(game,0,'raise',12);
    expect([...raised.actions].reverse().find(a=>a.playerId==='meena')?.text).toContain('raises to $12');
  });
});

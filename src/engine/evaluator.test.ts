import { describe,expect,it } from 'vitest';
import { compareHands,evaluate } from './evaluator';
import type { Card,Rank,Suit } from './types';
const c=(rank:Rank,suit:Suit='spades'):Card=>({rank,suit});

describe('hand evaluator',()=>{
  it('recognises a royal flush separately',()=>expect(evaluate([c(10),c(11),c(12),c(13),c(14)]).name).toBe('Royal Flush'));
  it('recognises the ace-low straight',()=>expect(evaluate([c(14),c(2,'hearts'),c(3,'clubs'),c(4,'diamonds'),c(5)]).values[0]).toBe(5));
  it('uses the next-highest card to break a pair tie',()=>{
    const kings=evaluate([c(14),c(14,'hearts'),c(13),c(8),c(3)]);
    const queens=evaluate([c(14),c(14,'hearts'),c(12),c(8),c(3)]);
    expect(compareHands(kings,queens)).toBeGreaterThan(0);
  });
  it('selects the best five cards from seven',()=>expect(evaluate([c(2),c(3),c(10),c(11),c(12),c(13),c(14)]).name).toBe('Royal Flush'));
});

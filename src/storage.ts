import type { GameState, NotebookEntry } from './engine/types';
const GAME='pokermom-game-v1',NOTEBOOK='pokermom-notebook-v2',PROGRESS='pokermom-progress-v1';
export const loadGame=():GameState|null=>{try{return JSON.parse(localStorage.getItem(GAME)||'null')}catch{return null}};
export const saveGame=(game:GameState)=>localStorage.setItem(GAME,JSON.stringify(game));
export const clearGame=()=>localStorage.removeItem(GAME);
export const loadNotebook=():NotebookEntry[]=>{try{return JSON.parse(localStorage.getItem(NOTEBOOK)||'[]')}catch{return []}};
export const saveNotebook=(items:NotebookEntry[])=>localStorage.setItem(NOTEBOOK,JSON.stringify(items));
export const loadProgress=():Record<string,number>=>{try{return JSON.parse(localStorage.getItem(PROGRESS)||'{}')}catch{return {}}};
export const saveProgress=(value:Record<string,number>)=>localStorage.setItem(PROGRESS,JSON.stringify(value));

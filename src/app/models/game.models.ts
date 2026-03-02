export type CellColor = 'blue' | 'yellow' | 'green' | 'red';

export type CellId = number;

export interface CellVM {
  id: CellId;
  row: number;
  col: number;
  color: CellColor;
}

export interface Score {
  player: number;
  computer: number;
}

export type GameStatus = 'idle' | 'running' | 'finished';

export type RoundResult = 'player' | 'computer';

export type GameWinner = RoundResult;

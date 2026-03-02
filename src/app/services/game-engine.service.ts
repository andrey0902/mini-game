import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import {
  CellColor,
  CellId,
  CellVM,
  GameStatus,
  GameWinner,
  RoundResult,
  Score
} from '../models/game.models';
import { RandomService } from './random.service';
import { GRID_SIZE, MAX_ROUND_MS, MIN_ROUND_MS, TARGET_SCORE, TOTAL_CELLS } from '../constants';

interface ActiveRound {
  cellId: CellId;
  resolved: boolean;
}

@Injectable({ providedIn: 'root' })
export class GameEngineService {
  private readonly cellsSubject = new BehaviorSubject<readonly CellVM[]>(this.createInitialBoard());
  private readonly scoreSubject = new BehaviorSubject<Score>({ player: 0, computer: 0 });
  private readonly statusSubject = new BehaviorSubject<GameStatus>('idle');
  private readonly highlightedCellIdSubject = new BehaviorSubject<CellId | null>(null);
  private readonly winnerSubject = new BehaviorSubject<GameWinner | null>(null);
  private readonly statusMessageSubject = new BehaviorSubject<string>('Waiting');
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly cancelRoundTimer$ = new Subject<void>();

  private roundDurationMs = 1_000;
  private activeRound: ActiveRound | null = null;
  private lastRoundWinner: RoundResult | null = null;

  readonly cells$ = this.cellsSubject.asObservable();
  readonly score$ = this.scoreSubject.asObservable();
  readonly status$ = this.statusSubject.asObservable();
  readonly winner$ = this.winnerSubject.asObservable();
  readonly statusMessage$ = this.statusMessageSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor(private readonly randomService: RandomService) {}

  start(nMs: number): void {
    if (!this.isValidRoundDuration(nMs)) {
      this.setError(`N must be between ${MIN_ROUND_MS} and ${MAX_ROUND_MS} milliseconds.`);
      return;
    }

    const status = this.statusSubject.value;
    if (status === 'running') {
      this.setError('Game is already running.');
      return;
    }

    if (status === 'finished') {
      this.setError('Game is finished. Press Restart or Play again.');
      return;
    }

    this.beginGame(nMs);
  }

  restart(nMs: number): void {
    if (!this.isValidRoundDuration(nMs)) {
      this.setError(`N must be between ${MIN_ROUND_MS} and ${MAX_ROUND_MS} milliseconds.`);
      return;
    }

    this.beginGame(nMs);
  }

  stop(): void {
    this.cancelRoundTimer$.next();
    this.activeRound = null;
    this.highlightedCellIdSubject.next(null);

    if (this.statusSubject.value === 'running') {
      this.statusSubject.next('idle');
      this.statusMessageSubject.next('Waiting');
    }
  }

  clickCell(cellId: CellId): void {
    const status = this.statusSubject.value;
    if (status === 'finished') {
      this.setError('Game already finished. Restart to play again.');
      return;
    }

    if (status !== 'running' || this.activeRound === null) {
      return;
    }

    if (this.activeRound.resolved || this.activeRound.cellId !== cellId) {
      return;
    }

    const targetCell = this.cellsSubject.value[cellId];
    if (!targetCell || targetCell.color !== 'yellow') {
      return;
    }

    this.resolveRound('player');
  }

  private beginGame(nMs: number): void {
    this.cancelRoundTimer$.next();
    this.roundDurationMs = nMs;
    this.activeRound = null;
    this.lastRoundWinner = null;

    this.cellsSubject.next(this.createInitialBoard());
    this.scoreSubject.next({ player: 0, computer: 0 });
    this.winnerSubject.next(null);
    this.highlightedCellIdSubject.next(null);
    this.statusSubject.next('running');
    this.statusMessageSubject.next('Your turn');
    this.setError(null);

    this.startNextRound();
  }

  private startNextRound(): void {
    if (this.statusSubject.value !== 'running') {
      return;
    }

    const availableBlueCellIds = this.cellsSubject.value
      .filter((cell) => cell.color === 'blue')
      .map((cell) => cell.id);

    if (availableBlueCellIds.length === 0) {
      this.finishGame(this.resolveWinnerFromCurrentScore());
      return;
    }

    const nextCellId = this.randomService.pickRandom(availableBlueCellIds);

    this.applyCellColor(nextCellId, 'yellow');
    this.highlightedCellIdSubject.next(nextCellId);
    this.statusMessageSubject.next('Your turn');

    this.activeRound = {
      cellId: nextCellId,
      resolved: false
    };

    this.cancelRoundTimer$.next();
    timer(this.roundDurationMs)
      .pipe(take(1), takeUntil(this.cancelRoundTimer$))
      .subscribe(() => {
        this.resolveRound('computer');
      });
  }

  private resolveRound(result: RoundResult): void {
    if (this.statusSubject.value !== 'running' || this.activeRound === null || this.activeRound.resolved) {
      return;
    }

    this.activeRound.resolved = true;
    this.cancelRoundTimer$.next();

    const resolvedCellId = this.activeRound.cellId;
    this.activeRound = null;

    this.applyCellColor(resolvedCellId, result === 'player' ? 'green' : 'red');
    this.highlightedCellIdSubject.next(null);
    this.incrementScore(result);
    this.lastRoundWinner = result;

    if (result === 'computer') {
      this.statusMessageSubject.next('Computer scored');
    }

    if (this.shouldFinishGame()) {
      this.finishGame(this.resolveWinnerFromCurrentScore());
      return;
    }

    this.startNextRound();
  }

  private incrementScore(result: RoundResult): void {
    const current = this.scoreSubject.value;
    if (result === 'player') {
      this.scoreSubject.next({ player: current.player + 1, computer: current.computer });
      return;
    }

    this.scoreSubject.next({ player: current.player, computer: current.computer + 1 });
  }

  private shouldFinishGame(): boolean {
    const score = this.scoreSubject.value;

    if (score.player >= TARGET_SCORE || score.computer >= TARGET_SCORE) {
      return true;
    }

    return !this.cellsSubject.value.some((cell) => cell.color === 'blue');
  }

  private resolveWinnerFromCurrentScore(): GameWinner {
    const score = this.scoreSubject.value;

    if (score.player > score.computer) {
      return 'player';
    }

    if (score.computer > score.player) {
      return 'computer';
    }

    if (this.lastRoundWinner !== null) {
      return this.lastRoundWinner;
    }

    return 'computer';
  }

  private finishGame(winner: GameWinner): void {
    this.cancelRoundTimer$.next();
    this.activeRound = null;
    this.winnerSubject.next(winner);
    this.highlightedCellIdSubject.next(null);
    this.statusSubject.next('finished');
    this.statusMessageSubject.next('Finished');
  }

  private applyCellColor(cellId: CellId, color: CellColor): void {
    const updated = this.cellsSubject.value.map((cell) =>
      cell.id === cellId
        ? {
            ...cell,
            color
          }
        : cell
    );

    this.cellsSubject.next(updated);
  }

  private isValidRoundDuration(value: number): boolean {
    return Number.isFinite(value) && value >= MIN_ROUND_MS && value <= MAX_ROUND_MS;
  }

  private createInitialBoard(): readonly CellVM[] {
    return Array.from({ length: TOTAL_CELLS }, (_, id) => ({
      id,
      row: Math.floor(id / GRID_SIZE),
      col: id % GRID_SIZE,
      color: 'blue' as const
    }));
  }

  private setError(message: string | null): void {
    this.errorSubject.next(message);
  }
}

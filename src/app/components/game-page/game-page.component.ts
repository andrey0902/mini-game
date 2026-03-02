import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GameBoardComponent } from '../game-board/game-board.component';
import { ModalComponent } from '../modal/modal.component';
import { GameEngineService } from '../../services/game-engine.service';
import { GameWinner } from '../../models/game.models';
import { DEFAULT_ROUND_MS, MAX_ROUND_MS, MIN_ROUND_MS } from '../../constants';



@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, GameBoardComponent, ModalComponent],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly gameEngineService = inject(GameEngineService);

  readonly roundDurationMs = signal<number>(DEFAULT_ROUND_MS);
  readonly modalOpen = signal<boolean>(false);
  readonly isDurationValid = computed(() => {
    const value = this.roundDurationMs();
    return Number.isFinite(value) && value >= MIN_ROUND_MS && value <= MAX_ROUND_MS;
  });

  readonly vm$ = combineLatest({
    cells: this.gameEngineService.cells$,
    score: this.gameEngineService.score$,
    status: this.gameEngineService.status$,
    statusMessage: this.gameEngineService.statusMessage$,
    winner: this.gameEngineService.winner$,
    error: this.gameEngineService.error$
  });

  readonly modalWinnerText$ = this.gameEngineService.winner$.pipe(map((winner) => this.getWinnerLabel(winner)));
  readonly modalScoreText$ = this.gameEngineService.score$.pipe(
    map((score) => `Player ${score.player} - Computer ${score.computer}`)
  );

  constructor() {
    this.gameEngineService.status$
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        if (status === 'finished') {
          this.modalOpen.set(true);
          return;
        }

        this.modalOpen.set(false);
      });
  }

  onRoundDurationChange(value: number | null): void {
    this.roundDurationMs.set(typeof value === 'number' ? value : DEFAULT_ROUND_MS);
  }

  onStart(): void {
    this.gameEngineService.start(this.roundDurationMs());
  }

  onRestart(): void {
    this.gameEngineService.restart(this.roundDurationMs());
  }

  onCellClick(cellId: number): void {
    this.gameEngineService.clickCell(cellId);
  }

  onPlayAgain(): void {
    this.modalOpen.set(false);
    this.gameEngineService.restart(this.roundDurationMs());
  }

  onCloseModal(): void {
    this.modalOpen.set(false);
  }

  private getWinnerLabel(winner: GameWinner | null): string {
    if (winner === 'player') {
      return 'Player';
    }

    if (winner === 'computer') {
      return 'Computer';
    }

    return '-';
  }
}

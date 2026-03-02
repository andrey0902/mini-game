import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor } from '@angular/common';

import { CellId, CellVM } from '../../models/game.models';
import { GameCellComponent } from '../game-cell/game-cell.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [NgFor, GameCellComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameBoardComponent {
  @Input({ required: true }) cells: readonly CellVM[] = [];
  @Output() cellClick = new EventEmitter<CellId>();

  trackByCellId(_index: number, cell: CellVM): CellId {
    return cell.id;
  }

  onCellClick(cellId: CellId): void {
    this.cellClick.emit(cellId);
  }
}

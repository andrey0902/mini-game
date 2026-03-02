import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

import { CellId, CellVM } from '../../models/game.models';

@Component({
  selector: 'app-game-cell',
  standalone: true,
  imports: [NgClass],
  templateUrl: './game-cell.component.html',
  styleUrl: './game-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameCellComponent {
  @Input({ required: true }) cell!: CellVM;
  @Output() cellClick = new EventEmitter<CellId>();

  onClick(): void {
    this.cellClick.emit(this.cell.id);
  }
}

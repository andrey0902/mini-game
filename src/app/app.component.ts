import { ChangeDetectionStrategy, Component } from '@angular/core';

import { GamePageComponent } from './components/game-page/game-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GamePageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}

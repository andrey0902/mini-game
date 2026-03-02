# Mini Game - 10x10 Grid Reaction

Standalone Angular mini-game with RxJS-driven game loop, custom accessible modal, and deterministic scoring.

## Run

1. Install dependencies: `npm install`
2. Start dev server: `npm start`
3. Open `http://localhost:4200/`

## Architecture

- Uses standalone Angular components with `ChangeDetectionStrategy.OnPush` throughout the UI.
- `GameEngineService` owns game state and round lifecycle (start/restart/stop/click), keeping components presentation-focused.
- Round timing uses RxJS `timer()` with cancellation via `takeUntil` to prevent timeout leaks and race conditions.
- Strongly typed game domain in `game.models.ts` (`CellVM`, `Score`, `GameStatus`, `RoundResult`, etc.).
- `RandomService` isolates random cell picking for testability and clean dependency boundaries.
- `GamePageComponent` is a container that binds controls to service methods and composes board + modal.
- `GameBoardComponent`/`GameCellComponent` are presentational and use `trackBy` to minimize re-renders.
- Custom `ModalComponent` provides ARIA dialog semantics, escape handling, backdrop close, and basic keyboard focus trap.
- Guard rails prevent invalid `N`, start spam, post-finish interaction, and double scoring on repeated clicks.
- No browser alerts/confirm APIs are used; all end-game UX is handled by the modal.

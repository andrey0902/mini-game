import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() winnerText = '';
  @Input() finalScoreText = '';
  @Input() closeOnEsc = true;

  @Output() close = new EventEmitter<void>();
  @Output() playAgain = new EventEmitter<void>();

  @ViewChild('dialog', { static: false }) dialogRef?: ElementRef<HTMLElement>;
  @ViewChild('playAgainButton', { static: false }) playAgainButtonRef?: ElementRef<HTMLButtonElement>;

  private previousFocusedElement: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ('open' in changes) {
      if (this.open) {
        this.previousFocusedElement = document.activeElement as HTMLElement | null;
        queueMicrotask(() => {
          this.playAgainButtonRef?.nativeElement.focus();
        });
      } else {
        this.previousFocusedElement?.focus();
      }
    }
  }

  ngOnDestroy(): void {
    this.previousFocusedElement = null;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (!this.open) {
      return;
    }

    if (event.key === 'Escape' && this.closeOnEsc) {
      event.preventDefault();
      this.close.emit();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialogRef?.nativeElement;
    if (!dialog) {
      return;
    }

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (activeElement === first || activeElement === dialog)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast animate-slide-in" [ngClass]="toast.type" (click)="toastService.remove(toast.id)">
          <div class="toast-icon">
            <span class="material-icons">{{ getIcon(toast.type) }}</span>
          </div>
          <span class="message">{{ toast.message }}</span>
          <button class="close-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      min-width: 320px;
      max-width: 450px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--surface-border);
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-md);
      cursor: pointer;
    }

    .animate-slide-in {
      animation: slideIn 0.3s cubic-bezier(0, 0, 0.2, 1) forwards;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: grid;
      place-items: center;
    }

    .success .toast-icon { background: var(--success-soft); color: var(--success); }
    .error .toast-icon { background: var(--error-soft); color: var(--error); }
    .info .toast-icon { background: var(--info-soft); color: var(--info); }
    .warning .toast-icon { background: var(--warning-soft); color: var(--warning); }

    .message { flex: 1; font-size: 14px; font-weight: 600; }
    
    .close-btn {
      color: var(--text-muted);
      opacity: 0.5;
      transition: var(--transition);
    }
    
    .toast:hover .close-btn { opacity: 1; }
    .close-btn span { font-size: 18px; }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}

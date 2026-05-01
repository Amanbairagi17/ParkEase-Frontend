import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../core/models/types';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-card" [class.unread]="!notification.isRead">
      @if (!notification.isRead) {
        <div class="unread-dot"></div>
      }
      
      <div class="card-icon" [ngClass]="notification.type.toLowerCase()">
        <span class="material-icons">{{ getIcon(notification.type) }}</span>
      </div>

      <div class="card-body">
        <div class="card-top">
          <h3 class="title">{{ notification.title }}</h3>
          <span class="timestamp">{{ notification.sentAt | date:'MMM d, h:mm a' }}</span>
        </div>
        
        <p class="message">{{ notification.message }}</p>

        <div class="card-bottom">
          <div class="tags">
            <span class="type-tag" [ngClass]="notification.type.toLowerCase()">
              {{ notification.type | titlecase }}
            </span>
            <span class="channel-tag">
              <span class="material-icons">{{ getChannelIcon(notification.channel) }}</span>
              {{ notification.channel === 'IN_APP' ? 'In-App' : (notification.channel | titlecase) }}
            </span>
          </div>

          <div class="actions">
            @if (!notification.isRead) {
              <button class="action-btn read" (click)="onRead.emit(notification.notificationId)">
                Mark as read
              </button>
            }
            <button class="action-btn delete" (click)="onDelete.emit(notification.notificationId)">
              <span class="material-icons">delete_outline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      gap: 16px;
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
    }

    .notification-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
      border-color: var(--primary-soft);
    }

    .notification-card.unread {
      background: var(--primary-soft);
      border-color: rgba(59, 130, 246, 0.1);
    }

    .unread-dot {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--primary);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-icon.booking { background: var(--success-soft); color: var(--success); }
    .card-icon.payment { background: var(--primary-soft); color: var(--primary); }
    .card-icon.expiry { background: var(--error-soft); color: var(--error); }
    .card-icon.checkin { background: var(--info-soft); color: var(--info); }

    .card-body { flex: 1; min-width: 0; }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
      gap: 12px;
    }

    .title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timestamp {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .message {
      font-size: 14px;
      color: var(--text-muted);
      margin: 0 0 12px 0;
      line-height: 1.5;
    }

    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tags { display: flex; gap: 8px; }

    .type-tag {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .type-tag.booking { background: var(--success-soft); color: var(--success); }
    .type-tag.payment { background: var(--primary-soft); color: var(--primary); }
    .type-tag.expiry { background: var(--error-soft); color: var(--error); }

    .channel-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .channel-tag span { font-size: 14px; }

    .actions { display: flex; gap: 8px; align-items: center; }

    .action-btn {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      transition: var(--transition);
    }

    .action-btn.read {
      background: transparent;
      border: 1px solid var(--primary);
      color: var(--primary);
    }

    .action-btn.read:hover {
      background: var(--primary);
      color: white;
    }

    .action-btn.delete {
      color: var(--text-muted);
    }

    .action-btn.delete:hover {
      color: var(--error);
      background: var(--error-soft);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCardComponent {
  @Input({ required: true }) notification!: Notification;
  @Output() onRead = new EventEmitter<string>();
  @Output() onDelete = new EventEmitter<string>();

  getIcon(type: string): string {
    switch (type.toUpperCase()) {
      case 'BOOKING': return 'event_available';
      case 'PAYMENT': return 'payments';
      case 'EXPIRY': return 'timer';
      case 'CHECKIN': return 'login';
      case 'CHECKOUT': return 'logout';
      default: return 'notifications';
    }
  }

  getChannelIcon(channel: string): string {
    switch (channel.toUpperCase()) {
      case 'EMAIL': return 'alternate_email';
      case 'SMS': return 'textsms';
      default: return 'smartphone';
    }
  }
}

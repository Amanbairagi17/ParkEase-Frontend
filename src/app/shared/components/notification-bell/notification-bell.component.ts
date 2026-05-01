import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/types';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-container">
      <button class="bell-btn" (click)="toggleDropdown($event)">
        <span class="material-icons">notifications</span>
        @if ((notificationService.unreadCount$ | async); as count) {
          <span class="badge">{{ count > 9 ? '9+' : count }}</span>
        }
      </button>

      <!-- Dropdown -->
      <div class="dropdown" [class.show]="showDropdown" (click)="$event.stopPropagation()">
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <button class="mark-btn" (click)="markAllRead()">Mark all read</button>
        </div>

        <div class="notification-list">
          @if ((notificationService.notifications$ | async); as notifications) {
            @if (notifications.length === 0) {
              <div class="empty-state">
                <span class="material-icons">notifications_off</span>
                <p>No notifications yet</p>
              </div>
            } @else {
              @for (notification of notifications.slice(0, 5); track notification.notificationId) {
                <div class="notification-item" 
                     [class.unread]="!notification.isRead"
                     (click)="onNotificationClick(notification)">
                  <div class="icon-box" [ngClass]="notification.type.toLowerCase()">
                    <span class="material-icons">{{ getIcon(notification.type) }}</span>
                  </div>
                  <div class="content">
                    <p class="title">{{ notification.title }}</p>
                    <p class="message">{{ notification.message }}</p>
                    <p class="time">{{ notification.sentAt | date:'shortTime' }}</p>
                  </div>
                </div>
              }
            }
          } @else {
            <div class="loading-state">
              <span class="material-icons rotating">sync</span>
            </div>
          }
        </div>

        <a routerLink="/driver/notifications" class="view-all" (click)="showDropdown = false">
          View all notifications
        </a>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
      display: inline-block;
    }

    .bell-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      transition: var(--transition);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bell-btn:hover {
      background: var(--bg);
      color: var(--text-main);
    }

    .badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: var(--error);
      color: white;
      font-size: 10px;
      font-weight: 800;
      min-width: 16px;
      height: 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid var(--surface);
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 340px;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      z-index: 1000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      transform-origin: top right;
      animation: popIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dropdown.show {
      display: flex;
    }

    @keyframes popIn {
      from { transform: scale(0.95) translateY(-10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    .dropdown-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdown-header h3 {
      margin: 0;
      font-size: 16px;
      color: var(--text-main);
    }

    .mark-btn {
      color: var(--primary);
      font-size: 12px;
      font-weight: 600;
    }

    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      padding: 12px 20px;
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: var(--transition);
      border-bottom: 1px solid var(--surface-border);
    }

    .notification-item:hover {
      background: var(--bg);
    }

    .notification-item.unread {
      background: var(--primary-soft);
    }

    .icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-box.booking { background: var(--success-soft); color: var(--success); }
    .icon-box.payment { background: var(--primary-soft); color: var(--primary); }
    .icon-box.expiry { background: var(--error-soft); color: var(--error); }
    .icon-box.checkin { background: var(--info-soft); color: var(--info); }

    .content { flex: 1; min-width: 0; }
    .title { font-weight: 600; font-size: 14px; color: var(--text-main); margin: 0 0 2px 0; }
    .message { font-size: 13px; color: var(--text-muted); margin: 0 0 4px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .time { font-size: 11px; color: var(--text-muted); font-weight: 500; }

    .view-all {
      display: block;
      padding: 14px;
      text-align: center;
      background: var(--bg);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      transition: var(--transition);
    }

    .view-all:hover {
      color: var(--primary);
      background: var(--primary-soft);
    }

    .empty-state { padding: 48px 24px; text-align: center; color: var(--text-muted); }
    .empty-state span { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
    .empty-state p { margin: 0; font-size: 14px; font-weight: 500; }

    .loading-state { padding: 48px; text-align: center; color: var(--primary); }
    .rotating { animation: rotate 1s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class NotificationBellComponent {
  notificationService = inject(NotificationService);
  showDropdown = false;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    
    if (this.showDropdown) {
      const listener = () => {
        this.showDropdown = false;
        window.removeEventListener('click', listener);
      };
      window.addEventListener('click', listener, { once: true });
    }
  }

  markAllRead() {
    this.notificationService.markAllRead().subscribe();
  }

  onNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationId).subscribe();
    }
    this.showDropdown = false;
  }

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
}

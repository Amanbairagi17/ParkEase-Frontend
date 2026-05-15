import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/types';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { NotificationCardComponent } from '../../../shared/components/notification-card/notification-card.component';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state.component';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable, delay, startWith, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, 
    SkeletonLoaderComponent, 
    NotificationCardComponent, 
    EmptyStateComponent,
    FormsModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
  notificationService = inject(NotificationService);
  
  private typeFilter$ = new BehaviorSubject<string>('ALL');
  private channelFilter$ = new BehaviorSubject<string>('ALL');
  
  currentType = 'ALL';
  currentChannel = 'ALL';

  notifications$: Observable<Notification[]>;
  loading$: Observable<boolean>;

  constructor() {
    this.notifications$ = combineLatest([
      this.notificationService.notifications$,
      this.typeFilter$,
      this.channelFilter$
    ]).pipe(
      map(([notifications, type, channel]) => {
        return notifications
          .filter(n => {
            const typeMatch = type === 'ALL' || n.type.toUpperCase() === type;
            const channelMatch = channel === 'ALL' || n.channel.toUpperCase() === channel;
            return typeMatch && channelMatch;
          })
          .slice(0, 50); // Limit to 50 for performance
      }),
      distinctUntilChanged((prev: Notification[], curr: Notification[]) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    this.loading$ = this.notificationService.notifications$.pipe(
      map(() => false),
      startWith(true),
      distinctUntilChanged(),
      delay(500)
    );
  }
  
  ngOnInit(): void {
  }

  onTypeChange(type: string) {
    this.currentType = type;
    this.typeFilter$.next(type);
  }

  onChannelChange(channel: string) {
    this.currentChannel = channel;
    this.channelFilter$.next(channel);
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id).subscribe();
  }

  deleteNotification(id: string) {
    this.notificationService.deleteNotification(id).subscribe();
  }

  markAllRead() {
    this.notificationService.markAllRead().subscribe();
  }
}

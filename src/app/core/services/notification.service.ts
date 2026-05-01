import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, interval, startWith, switchMap, catchError, of, Subscription } from 'rxjs';
import { environment } from '@env/environment';
import { Notification } from '../models/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private readonly API = `${environment.apiUrl}/notifications`;
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private pollingSubscription?: Subscription;

  constructor() {
    // Automatically fetch notifications when user is logged in
    this.authService.user$.subscribe(user => {
      if (user) {
        this.refresh();
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  refresh(): void {
    const userId = this.authService.getUserIdFromToken();
    if (!userId) return;

    this.getNotifications(userId).subscribe();
    this.getUnreadCount(userId).subscribe();
  }

  private startPolling(): void {
    this.stopPolling();
    // Poll every 30 seconds for new notifications
    this.pollingSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => {
          const userId = this.authService.getUserIdFromToken();
          if (!userId) return of(null);
          return this.getUnreadCount(userId);
        })
      )
      .subscribe();
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  getNotifications(recipientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.API}/${recipientId}`).pipe(
      tap(notifications => {
        // Sort by date descending
        const sorted = notifications.sort((a, b) => 
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );
        this.notificationsSubject.next(sorted);
      }),
      catchError(err => {
        console.error('Error fetching notifications', err);
        return of([]);
      })
    );
  }

  getUnreadCount(recipientId: number): Observable<number> {
    return this.http.get<number>(`${this.API}/${recipientId}/unread-count`).pipe(
      tap(count => this.unreadCountSubject.next(count)),
      catchError(() => of(0))
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${this.API}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        const updated = current.map(n => 
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(updated);
        
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      })
    );
  }

  markAllRead(): Observable<any> {
    const userId = this.authService.getUserIdFromToken();
    if (!userId) return of(null);

    return this.http.put(`${this.API}/${userId}/read-all`, {}).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        const updated = current.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(updated);
        this.unreadCountSubject.next(0);
      })
    );
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${this.API}/${notificationId}`).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        const notification = current.find(n => n.notificationId === notificationId);
        const updated = current.filter(n => n.notificationId !== notificationId);
        this.notificationsSubject.next(updated);
        
        if (notification && !notification.isRead) {
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        }
      })
    );
  }
}

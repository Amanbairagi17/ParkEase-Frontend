import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, timer, catchError, of, Subscription, distinctUntilChanged, throwError, exhaustMap, forkJoin, Subject, debounceTime, switchMap } from 'rxjs';
import { Notification } from '../models/types';
import { AuthService } from './auth.service';
import { guardUserId, normalizeUserId } from '../utils/user-id';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  
  private readonly API = this.api.url('/notifications');
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private pollingSubscription?: Subscription;
  private pollingUserId: number | null = null;
  private refreshRequests$ = new Subject<number>();

  constructor() {
    // Start polling only when the authenticated userId changes.
    this.authService.user$.pipe(
      map(user => normalizeUserId(user?.userId ?? this.authService.getUserIdFromToken())),
      distinctUntilChanged()
    ).subscribe(userId => {
      if (userId !== null) {
        this.startPolling(userId);
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });

    this.refreshRequests$.pipe(
      debounceTime(250),
      switchMap(userId => forkJoin([
        this.getNotifications(userId),
        this.getUnreadCount(userId)
      ]))
    ).subscribe();
  }

  refresh(userId?: number): void {
    const targetId = guardUserId(userId ?? this.authService.getUserIdFromToken(), 'NotificationService.refresh');
    if (targetId === null) return;

    this.refreshRequests$.next(targetId);
  }

  private startPolling(userId: number): void {
    if (this.pollingSubscription && this.pollingUserId === userId) {
      return;
    }
    this.stopPolling();
    this.pollingUserId = userId;

    // Poll every 30 seconds for notifications and unread count.
    this.pollingSubscription = timer(0, 30000)
      .pipe(
        exhaustMap(() => forkJoin([
          this.getNotifications(userId),
          this.getUnreadCount(userId)
        ]))
      )
      .subscribe();
  }


  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    this.pollingSubscription = undefined;
    this.pollingUserId = null;
  }

  private syncUnreadCount(notifications: Notification[]): void {
    const unread = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unread);
  }

  getNotifications(recipientId: number): Observable<Notification[]> {
    const safeRecipientId = guardUserId(recipientId, 'NotificationService.getNotifications');
    if (safeRecipientId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Notification[]>(`${this.API}/${safeRecipientId}`).pipe(
      tap(notifications => {
        const normalized = notifications.map(n => ({
          ...n,
          channel: n.channel === 'IN_APP' ? 'APP' : n.channel
        }));

        // Sort by date descending safely
        const sorted = normalized.sort((a, b) => {
          const dateA = new Date(a.sentAt).getTime();
          const dateB = new Date(b.sentAt).getTime();
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          return dateB - dateA;
        });
        this.notificationsSubject.next(sorted);
        this.syncUnreadCount(sorted);
      }),
      catchError(err => {
        return of([]);
      })
    );
  }

  getUnreadCount(recipientId: number): Observable<number> {
    const safeRecipientId = guardUserId(recipientId, 'NotificationService.getUnreadCount');
    if (safeRecipientId === null) {
      return of(0);
    }
    return this.http.get<number>(`${this.API}/${safeRecipientId}/unread-count`).pipe(
      tap(count => this.unreadCountSubject.next(count)),
      catchError(() => of(0))
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    const current = this.notificationsSubject.value;
    const updated = current.map(n => 
      n.notificationId === notificationId ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(updated);
    this.syncUnreadCount(updated);

    return this.http.put(`${this.API}/${notificationId}/read`, {}).pipe(
      catchError(err => {
        this.notificationsSubject.next(current);
        this.syncUnreadCount(current);
        return throwError(() => err);
      })
    );
  }

  markAllRead(): Observable<any> {
    const userId = guardUserId(this.authService.getUserIdFromToken(), 'NotificationService.markAllRead');
    if (userId === null) return of(null);

    const current = this.notificationsSubject.value;
    const updated = current.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(updated);
    this.syncUnreadCount(updated);

    return this.http.put(`${this.API}/${userId}/read-all`, {}).pipe(
      catchError(err => {
        this.notificationsSubject.next(current);
        this.syncUnreadCount(current);
        return throwError(() => err);
      })
    );
  }

  deleteNotification(notificationId: string): Observable<any> {
    const current = this.notificationsSubject.value;
    const updated = current.filter(n => n.notificationId !== notificationId);
    this.notificationsSubject.next(updated);
    this.syncUnreadCount(updated);

    return this.http.delete(`${this.API}/${notificationId}`).pipe(
      catchError(err => {
        this.notificationsSubject.next(current);
        this.syncUnreadCount(current);
        return throwError(() => err);
      })
    );
  }
}

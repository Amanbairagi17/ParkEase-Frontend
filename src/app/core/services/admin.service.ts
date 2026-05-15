import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser, AdminStats, BroadcastRequest, WarnUserRequest } from '../models/types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/admin');

  // ── User Management ──────────────────────────────────────────────────────────

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.API}/users`);
  }

  getUser(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.API}/users/${userId}`);
  }

  suspendUser(userId: number): Observable<string> {
    return this.http.patch(`${this.API}/users/${userId}/suspend`, null, { responseType: 'text' });
  }

  reactivateUser(userId: number): Observable<string> {
    return this.http.patch(`${this.API}/users/${userId}/reactivate`, null, { responseType: 'text' });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/users/${userId}`);
  }

  getUsersByRole(role: string): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.API}/users/role/${role}`);
  }

  // ── Notification Management ──────────────────────────────────────────────

  broadcastAll(request: BroadcastRequest): Observable<string> {
    return this.http.post(`${this.API}/notifications/broadcast`, request, { responseType: 'text' });
  }

  broadcastDrivers(request: BroadcastRequest): Observable<string> {
    return this.http.post(`${this.API}/notifications/broadcast/drivers`, request, { responseType: 'text' });
  }

  broadcastManagers(request: BroadcastRequest): Observable<string> {
    return this.http.post(`${this.API}/notifications/broadcast/managers`, request, { responseType: 'text' });
  }

  warnUser(userId: number, request: WarnUserRequest): Observable<string> {
    return this.http.post(`${this.API}/notifications/warn/${userId}`, request, { responseType: 'text' });
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API}/stats`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { User, AuthResponse, LoginResponse } from '../models/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly STORAGE_KEY = 'parkease.auth';
  private readonly API = `${environment.apiUrl}/auth`;

  private state$ = new BehaviorSubject<AuthState>(this.loadFromStorage());

  readonly user$ = new BehaviorSubject<User | null>(this.loadFromStorage().user);
  readonly token$ = new BehaviorSubject<string | null>(this.loadFromStorage().token);

  get currentUser(): User | null { return this.state$.value.user; }
  get token(): string | null { return this.state$.value.token; }
  get isLoggedIn(): boolean { return !!this.token; }

  register(payload: {
    fullName: string; email: string; password: string;
    phone: string; role: User['role'];
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, payload).pipe(
      tap(res => this.persist(res.user, res.token, res.refreshToken))
    );
  }

  login(payload: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/login`, payload).pipe(
      tap(res => {
        const token = (res as any).accessToken || (res as any).token;
        const refreshToken = (res as any).refreshToken;
        if (token) this.handleOAuthSuccess(token, refreshToken);
      })
    );
  }

  handleOAuthSuccess(token: string, refreshToken?: string | null): void {
    if (!token) return;

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const role = payload.roles?.[0] || payload.authorities?.[0] || payload.role;
      const cleanRole = role?.replace('ROLE_', '');

      const user: User = { role: cleanRole } as User;
      this.persist(user, token, refreshToken);
    } catch (e) {
      console.error('Error processing token', e);
    }
  }

  sendOtp(email: string): Observable<string> {
    return this.http.post(`${this.API}/send-otp`, null, {
      params: { email },
      responseType: 'text'
    });
  }

  resetPassword(payload: { email: string; otp: string; newPassword: string }): Observable<string> {
    return this.http.post(`${this.API}/reset-password`, payload, { responseType: 'text' });
  }

  refreshToken(): Observable<LoginResponse> {
    const rt = this.state$.value.refreshToken;
    if (!rt) return throwError(() => new Error('No refresh token'));

    return this.http.post<LoginResponse>(`${this.API}/refresh`, { refreshToken: rt }).pipe(
      tap(res => {
        const token = res.accessToken || (res as any).token;

        if (token) {
          const payload: any = JSON.parse(atob(token.split('.')[1]));

          const role =
            payload.roles?.[0] ||
            payload.authorities?.[0] ||
            payload.role;

          const cleanRole = role?.replace('ROLE_', '');

          const user: User = {
            role: cleanRole
          } as User;

          this.persist(user, token, res.refreshToken);
        }
      })
    );
  }

  logout(): void {
    const rt = this.state$.value.refreshToken;

    if (rt) {
      this.http.post(`${this.API}/logout`, { refreshToken: rt }, { responseType: 'text' }).subscribe();
    }

    localStorage.removeItem(this.STORAGE_KEY);
    this.state$.next({ user: null, token: null, refreshToken: null });
    this.user$.next(null);
    this.token$.next(null);

    this.router.navigate(['/login']);
  }

  updateLocalUser(user: User): void {
    const state = this.state$.value;
    if (state.token) {
      this.persist(user, state.token, state.refreshToken);
    }
  }

  roleRedirect(): string {
    const role = this.currentUser?.role;

    if (role === 'DRIVER') return '/driver/dashboard';
    if (role === 'MANAGER') return '/manager/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';

    return '/';
  }

  getUserIdFromToken(): number | null {
    const token = this.token;
    if (!token) return null;

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || payload.sub || null;
    } catch {
      return null;
    }
  }

  persist(user: User | null, token: string, refreshToken?: string | null): void {
    const state: AuthState = { user, token, refreshToken: refreshToken ?? null };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    this.state$.next(state);
    this.user$.next(user);
    this.token$.next(token);
  }

  private loadFromStorage(): AuthState {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AuthState;
    } catch {}
    return { user: null, token: null, refreshToken: null };
  }
}
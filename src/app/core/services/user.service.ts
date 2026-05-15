import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { User } from '../models/types';
import { guardUserId } from '../utils/user-id';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/user');

  // GET /api/user/{userId}
  getUserById(userId: string | number): Observable<User> {
    const safeUserId = guardUserId(userId, 'UserService.getUserById');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<User>(`${this.API}/${safeUserId}`);
  }

  // GET /api/user/email/{email}
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.API}/email/${encodeURIComponent(email)}`);
  }

  // PUT /api/user/{userId}/profile
  updateProfile(userId: string | number, profileData: Partial<User>): Observable<User> {
    const safeUserId = guardUserId(userId, 'UserService.updateProfile');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.put<User>(`${this.API}/${safeUserId}/profile`, profileData);
  }

  // PATCH /api/user/{userId}/profile-picture
  uploadProfilePicture(userId: string | number, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    const safeUserId = guardUserId(userId, 'UserService.uploadProfilePicture');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.patch<User>(`${this.API}/${safeUserId}/profile-picture`, formData);
  }

  // DELETE /api/user/{userId}/profile-image
  deleteProfilePicture(userId: string | number): Observable<User> {
    const safeUserId = guardUserId(userId, 'UserService.deleteProfilePicture');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.delete<User>(`${this.API}/${safeUserId}/profile-image`);
  }
}

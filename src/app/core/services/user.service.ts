import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { User } from '../models/types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/user`;

  // GET /api/user/{userId}
  getUserById(userId: string | number): Observable<User> {
    return this.http.get<User>(`${this.API}/${userId}`);
  }

  // GET /api/user/email/{email}
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.API}/email/${encodeURIComponent(email)}`);
  }

  // PUT /api/user/{userId}/profile
  updateProfile(userId: string | number, profileData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API}/${userId}/profile`, profileData);
  }
}

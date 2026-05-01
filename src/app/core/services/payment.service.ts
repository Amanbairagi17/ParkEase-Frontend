import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Payment } from '../models/types';

export interface PaymentRequest {
  bookingId: string | number;
  userId: string | number;
  amount: number;
  mode: Payment['mode'];
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/payments`;

  // POST /api/payments  (DRIVER/ADMIN)
  process(payload: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.API, payload);
  }

  // GET /api/payments/booking/{bookingId}
  getByBooking(bookingId: string | number): Observable<Payment> {
    return this.http.get<Payment>(`${this.API}/booking/${bookingId}`);
  }

  // GET /api/payments/user/{userId}  (ADMIN or self)
  getByUser(userId: string | number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.API}/user/${userId}`);
  }

  // GET /api/payments/history/{userId}  (ADMIN or self)
  getHistory(userId: string | number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.API}/history/${userId}`);
  }

  // POST /api/payments/{paymentId}/refund  (ADMIN or owner)
  refund(paymentId: string | number): Observable<Payment> {
    return this.http.post<Payment>(`${this.API}/${paymentId}/refund`, {});
  }

  // GET /api/payments/{paymentId}/status
  getStatus(paymentId: string | number): Observable<string> {
    return this.http.get(`${this.API}/${paymentId}/status`, { responseType: 'text' });
  }

  // GET /api/payments  (ADMIN)
  getAll(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.API);
  }

  // GET /api/payments/revenue/{userId}  (ADMIN or self)
  getRevenue(userId: string | number): Observable<number> {
    return this.http.get<number>(`${this.API}/revenue/${userId}`);
  }
}

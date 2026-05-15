import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Payment, RazorpayOrder } from '../models/types';
import { guardUserId } from '../utils/user-id';
import { ApiService } from './api.service';

export interface PaymentRequest {
  bookingId: string | number;
  userId?: string | number;
  amount?: number;
  mode?: Payment['mode'];
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/payments');

  process(payload: PaymentRequest): Observable<Payment> {
    if (payload.userId !== undefined) {
      const safeUserId = guardUserId(payload.userId, 'PaymentService.process');
      if (safeUserId === null) {
        return throwError(() => new Error('Invalid userId'));
      }
    }
    return this.http.post<Payment>(`${this.API}/process`, {
      ...payload,
      mode: payload.mode ?? 'CASH'
    });
  }

  getByBooking(bookingId: string | number): Observable<Payment> {
    return this.http.get<Payment>(`${this.API}/booking/${bookingId}`);
  }

  getByUser(userId: string | number): Observable<Payment[]> {
    const safeUserId = guardUserId(userId, 'PaymentService.getByUser');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Payment[]>(`${this.API}/user/${safeUserId}`);
  }

  getHistory(userId: string | number): Observable<Payment[]> {
    const safeUserId = guardUserId(userId, 'PaymentService.getHistory');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Payment[]>(`${this.API}/history/${safeUserId}`);
  }

  refund(paymentId: string | number): Observable<Payment> {
    return this.http.post<Payment>(`${this.API}/${paymentId}/refund`, {});
  }

  getStatus(paymentId: string | number): Observable<string> {
    return this.http.get(`${this.API}/${paymentId}/status`, { responseType: 'text' });
  }

  getAll(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.API);
  }

  getRevenue(userId: string | number): Observable<number> {
    const safeUserId = guardUserId(userId, 'PaymentService.getRevenue');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<number>(`${this.API}/revenue/${safeUserId}`);
  }

  // Razorpay: create order
  createOrder(data: {
    bookingId: string | number;
    mode?: Payment['mode'];
  }): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(`${this.API}/create-order`, {
      ...data,
      mode: data.mode ?? 'UPI'
    });
  }

  // Razorpay: verify payment
  verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Observable<Payment> {
    return this.http.post<Payment>(`${this.API}/verify`, data);
  }
}

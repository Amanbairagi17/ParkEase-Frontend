import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Payment } from '../models/types';

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
  private readonly API = `${environment.apiUrl}/payments`;

  process(payload: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.API, payload);
  }

  getByBooking(bookingId: string | number): Observable<Payment> {
    return this.http.get<Payment>(`${this.API}/booking/${bookingId}`);
  }

  getByUser(userId: string | number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.API}/user/${userId}`);
  }

  getHistory(userId: string | number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.API}/history/${userId}`);
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
    return this.http.get<number>(`${this.API}/revenue/${userId}`);
  }

  // Razorpay: create order
  createOrder(data: {
    bookingId: string | number;
  }): Observable<any> {
    return this.http.post(`${this.API}/create-order`, data);
  }

  // Razorpay: verify payment
  verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Observable<any> {
    return this.http.post(`${this.API}/verify`, data);
  }
}

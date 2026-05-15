import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Booking, BookingEstimate, BookingRequest as BookingRequestPayload } from '../models/types';
import { guardUserId } from '../utils/user-id';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/bookings');

  create(payload: BookingRequestPayload): Observable<Booking> {
    const safeUserId = guardUserId(payload.userId, 'BookingService.create');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.post<Booking>(this.API, { ...payload, userId: safeUserId });
  }

  getById(bookingId: number | string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API}/${bookingId}`);
  }

  getByUser(userId: number | string): Observable<Booking[]> {
    const safeUserId = guardUserId(userId, 'BookingService.getByUser');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Booking[]>(`${this.API}/user/${safeUserId}`);
  }

  getHistory(userId: number | string): Observable<Booking[]> {
    const safeUserId = guardUserId(userId, 'BookingService.getHistory');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Booking[]>(`${this.API}/history/${safeUserId}`);
  }

  getByLot(lotId: number | string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/lot/${lotId}`);
  }

  getActiveByLot(lotId: number | string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/lot/${lotId}/active`);
  }

  getActive(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/active`);
  }

  cancel(bookingId: number | string): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/cancel`, {});
  }

  checkIn(bookingId: number | string): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/checkIn`, {});
  }

  checkOut(bookingId: number | string, hourlyRate?: number): Observable<Booking> {
    let params = new HttpParams();
    if (hourlyRate != null) {
      params = params.set('hourlyRate', hourlyRate.toString());
    }
    return this.http.put<Booking>(`${this.API}/${bookingId}/checkOut`, {}, { params });
  }

  extend(bookingId: number | string, newEndTime: string): Observable<Booking> {
    const params = new HttpParams().set('newEndTime', newEndTime);
    return this.http.put<Booking>(`${this.API}/${bookingId}/extend`, {}, { params });
  }

  calculateAmount(startTime: string, endTime: string, hourlyRate: number): Observable<number> {
    const params = new HttpParams()
      .set('startTime', startTime)
      .set('endTime', endTime)
      .set('hourlyRate', hourlyRate.toString());
    return this.http.get<number>(`${this.API}/calculateAmount`, { params });
  }

  getEstimate(bookingId: number | string): Observable<number> {
    return this.http.get<number>(`${this.API}/${bookingId}/estimate`);
  }

  estimate(payload: {
    lotId: number | string;
    spotId: number | string;
    startTime: string;
    endTime: string;
    bookingType: 'PRE_BOOKING' | 'WALK_IN_BOOKING';
  }): Observable<BookingEstimate> {
    return this.http.post<BookingEstimate>(`${this.API}/estimate`, payload);
  }
}
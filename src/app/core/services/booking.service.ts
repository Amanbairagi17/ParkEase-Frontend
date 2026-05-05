import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Booking } from '../models/types';

export interface BookingRequest {
  userId: number | string;
  lotId: number | string;
  spotId: number | string;
  vehiclePlate: string;
  vehicleType: Booking['vehicleType'];
  bookingType: Booking['bookingType'];
  pricingType: Booking['pricingType'];
  startTime: string;
  endTime: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/bookings`;

  create(payload: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.API, payload);
  }

  getById(bookingId: number | string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API}/${bookingId}`);
  }

  getByUser(userId: number | string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/user/${userId}`);
  }

  getHistory(userId: number | string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/history/${userId}`);
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
}
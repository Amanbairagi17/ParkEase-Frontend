import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Booking } from '../models/types';

export interface BookingRequest {
  userId: string | number;
  lotId: string | number;
  spotId: string | number;
  vehiclePlate: string;
  vehicleType: Booking['vehicleType'];
  bookingType: Booking['bookingType'];
  startTime: string;   // ISO 8601
  endTime: string;     // ISO 8601
  totalAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/bookings`;

  // POST /api/bookings  (DRIVER)
  create(payload: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.API, payload);
  }

  // GET /api/bookings/{bookingId}  (ADMIN or owner)
  getById(bookingId: string | number): Observable<Booking> {
    return this.http.get<Booking>(`${this.API}/${bookingId}`);
  }

  // GET /api/bookings/user/{userId}  (ADMIN or self)
  getByUser(userId: string | number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/user/${userId}`);
  }

  // GET /api/bookings/history/{userId}  (ADMIN or self) – completed bookings
  getHistory(userId: string | number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/history/${userId}`);
  }

  // GET /api/bookings/lot/{lotId}  (MANAGER/ADMIN)
  getByLot(lotId: string | number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/lot/${lotId}`);
  }

  // GET /api/bookings/active  (MANAGER/ADMIN)
  getActive(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API}/active`);
  }

  // PUT /api/bookings/{bookingId}/cancel  (ADMIN or owner)
  cancel(bookingId: string | number): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/cancel`, {});
  }

  // PUT /api/bookings/{bookingId}/checkIn  (ADMIN or owner)
  checkIn(bookingId: string | number): Observable<Booking> {
    return this.http.put<Booking>(`${this.API}/${bookingId}/checkIn`, {});
  }

  // PUT /api/bookings/{bookingId}/checkOut  (ADMIN or owner)
  checkOut(bookingId: string | number, hourlyRate?: number): Observable<Booking> {
    let params = new HttpParams();
    if (hourlyRate != null) params = params.set('hourlyRate', hourlyRate.toString());
    return this.http.put<Booking>(`${this.API}/${bookingId}/checkOut`, {}, { params });
  }

  // PUT /api/bookings/{bookingId}/extend?newEndTime=  (ADMIN or owner)
  extend(bookingId: string | number, newEndTime: string): Observable<Booking> {
    const params = new HttpParams().set('newEndTime', newEndTime);
    return this.http.put<Booking>(`${this.API}/${bookingId}/extend`, {}, { params });
  }

  // GET /api/bookings/calculateAmount?startTime=&endTime=&hourlyRate=
  calculateAmount(startTime: string, endTime: string, hourlyRate: number): Observable<number> {
    const params = new HttpParams()
      .set('startTime', startTime)
      .set('endTime', endTime)
      .set('hourlyRate', hourlyRate.toString());
    return this.http.get<number>(`${this.API}/calculateAmount`, { params });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParkingSpot } from '../models/types';
import { ApiService } from './api.service';

export interface ParkingSpotRequest {
  lotId: string | number;
  spotNumber: string;
  floor: string | number;
  spotType: ParkingSpot['spotType'];
  vehicleType: ParkingSpot['vehicleType'];
  pricePerHour: number;
  handicapped?: boolean;
  EVCharging?: boolean;
}

export interface BulkSpotRequest {
  spots: ParkingSpotRequest[];
}

@Injectable({ providedIn: 'root' })
export class ParkingSpotService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/parking-spots');

  // POST /api/parking-spots  (MANAGER/ADMIN)
  addSpot(payload: ParkingSpotRequest): Observable<ParkingSpot> {
    return this.http.post<ParkingSpot>(this.API, payload);
  }

  // POST /api/parking-spots/bulk  (MANAGER/ADMIN)
  addBulk(payload: BulkSpotRequest): Observable<ParkingSpot[]> {
    return this.http.post<ParkingSpot[]>(`${this.API}/bulk`, payload);
  }

  // GET /api/parking-spots/{spotId}
  getById(spotId: string | number): Observable<ParkingSpot> {
    return this.http.get<ParkingSpot>(`${this.API}/${spotId}`);
  }

  // GET /api/parking-spots/lot/{lotId}
  getByLot(lotId: string | number): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.API}/lot/${lotId}`);
  }

  // GET /api/parking-spots/lot/{lotId}/available
  getAvailable(lotId: string | number): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.API}/lot/${lotId}/available`);
  }

  // GET /api/parking-spots/lot/{lotId}/count-available
  countAvailable(lotId: string | number): Observable<number> {
    return this.http.get<number>(`${this.API}/lot/${lotId}/count-available`);
  }

  // PATCH /api/parking-spots/{spotId}/reserve  (DRIVER/ADMIN)
  reserve(spotId: string | number): Observable<ParkingSpot> {
    return this.http.patch<ParkingSpot>(`${this.API}/${spotId}/reserve`, {});
  }

  // PATCH /api/parking-spots/{spotId}/occupy  (DRIVER/ADMIN)
  occupy(spotId: string | number): Observable<ParkingSpot> {
    return this.http.patch<ParkingSpot>(`${this.API}/${spotId}/occupy`, {});
  }

  // PATCH /api/parking-spots/{spotId}/release  (DRIVER/ADMIN)
  release(spotId: string | number): Observable<ParkingSpot> {
    return this.http.patch<ParkingSpot>(`${this.API}/${spotId}/release`, {});
  }

  // PUT /api/parking-spots/{spotId}  (OWNER/ADMIN)
  update(spotId: string | number, payload: Partial<ParkingSpotRequest>): Observable<ParkingSpot> {
    return this.http.put<ParkingSpot>(`${this.API}/${spotId}`, payload);
  }

  // DELETE /api/parking-spots/{spotId}  (OWNER/ADMIN)
  delete(spotId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${spotId}`);
  }
}

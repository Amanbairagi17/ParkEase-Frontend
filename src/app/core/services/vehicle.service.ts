import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Vehicle } from '../models/types';
import { guardUserId } from '../utils/user-id';
import { ApiService } from './api.service';

export interface VehicleRequest {
  ownerId: string | number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleType: Vehicle['vehicleType'];
  isEV: boolean;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/vehicle');

  // POST /api/vehicle/register
  register(payload: VehicleRequest): Observable<Vehicle> {
    const safeOwnerId = guardUserId(payload.ownerId, 'VehicleService.register');
    if (safeOwnerId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.post<Vehicle>(`${this.API}/register`, payload);
  }

  // GET /api/vehicle/getById/{vehicleId}
  getById(vehicleId: string | number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.API}/getById/${vehicleId}`);
  }

  // GET /api/vehicle/user/{ownerId}
  getByOwner(ownerId: string | number): Observable<Vehicle[]> {
    const safeOwnerId = guardUserId(ownerId, 'VehicleService.getByOwner');
    if (safeOwnerId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Vehicle[]>(`${this.API}/user/${safeOwnerId}`);
  }

  // GET /api/vehicle/getByLicensePlate/{licensePlate}
  getByLicensePlate(licensePlate: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.API}/getByLicensePlate/${encodeURIComponent(licensePlate)}`);
  }

  // PUT /api/vehicle/update/{vehicleId}
  update(vehicleId: string | number, payload: Partial<VehicleRequest>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.API}/update/${vehicleId}`, payload);
  }

  // DELETE /api/vehicle/delete/{vehicleId}
  delete(vehicleId: string | number): Observable<string> {
    return this.http.delete(`${this.API}/delete/${vehicleId}`, { responseType: 'text' });
  }

  // GET /api/vehicle/getAllVehicles  (Admin)
  getAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.API}/getAllVehicles`);
  }

  // GET /api/vehicle/getVehicleType/{vehicleId}
  getVehicleType(vehicleId: string | number): Observable<string> {
    return this.http.get(`${this.API}/getVehicleType/${vehicleId}`, { responseType: 'text' });
  }

  // GET /api/vehicle/isEVVehicle/{vehicleId}
  isEV(vehicleId: string | number): Observable<boolean> {
    return this.http.get<boolean>(`${this.API}/isEVVehicle/${vehicleId}`);
  }
}

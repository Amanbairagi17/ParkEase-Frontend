import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ParkingLot } from '../models/types';
import { map } from 'rxjs';

export interface ParkingLotRequest {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  managerId: string | number;
  openTime: string;
  closeTime: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ParkingLotService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/parking-lots`;

  // POST /api/parking-lots  (MANAGER/ADMIN)
  create(payload: ParkingLotRequest): Observable<ParkingLot> {
    return this.http.post<ParkingLot>(this.API, payload);
  }

  // GET /api/parking-lots/{lotId}
  getById(lotId: string | number): Observable<ParkingLot> {
    return this.http.get<ParkingLot>(`${this.API}/${lotId}`);
  }

  // GET /api/parking-lots/city/{city}
  getByCity(city: string): Observable<ParkingLot[]> {
    return this.http.get<ParkingLot[]>(`${this.API}/city/${encodeURIComponent(city)}`);
  }

  // GET /api/parking-lots/nearby?latitude=&longitude=&radiusKm=
  getNearby(latitude: number, longitude: number, radiusKm = 5): Observable<ParkingLot[]> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radiusKm', radiusKm.toString());
    return this.http.get<ParkingLot[]>(`${this.API}/nearby`, { params });
  }

  // GET /api/parking-lots/manager/{managerId}  (MANAGER/ADMIN)
  getByManager(managerId: string | number): Observable<ParkingLot[]> {
  return this.http.get<any>(`${this.API}/manager/${managerId}`)
    .pipe(map(res => res?.data ?? res ?? []));
}

  // GET /api/parking-lots/search?keyword=
  search(keyword: string): Observable<ParkingLot[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<ParkingLot[]>(`${this.API}/search`, { params });
  }

  // PUT /api/parking-lots/{lotId}  (MANAGER/ADMIN)
  update(lotId: string | number, payload: Partial<ParkingLotRequest>): Observable<ParkingLot> {
    return this.http.put<ParkingLot>(`${this.API}/${lotId}`, payload);
  }

  // PATCH /api/parking-lots/{lotId}/toggle-open  (MANAGER/ADMIN)
  toggleOpen(lotId: string | number): Observable<void> {
    return this.http.patch<void>(`${this.API}/${lotId}/toggle-open`, {});
  }

  // DELETE /api/parking-lots/{lotId}  (ADMIN)
  delete(lotId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${lotId}`);
  }

  // PATCH /api/parking-lots/{lotId}/decrement-available  (ADMIN/internal)
  decrementAvailable(lotId: string | number): Observable<void> {
    return this.http.patch<void>(`${this.API}/${lotId}/decrement-available`, {});
  }

  // PATCH /api/parking-lots/{lotId}/increment-available  (ADMIN/internal)
  incrementAvailable(lotId: string | number): Observable<void> {
    return this.http.patch<void>(`${this.API}/${lotId}/increment-available`, {});
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { Booking } from '../../../core/models/types';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-manager-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-bookings.component.html',
  styleUrls: ['./manager-bookings.component.css']
})
export class ManagerBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private lotService = inject(ParkingLotService);
  bookings: Booking[] = [];
  loading = true;

  ngOnInit(): void {
    const uid = this.auth.currentUser?.userId;
    if (!uid) return;
    this.lotService.getByManager(uid).pipe(catchError(() => of([]))).subscribe(lots => {
      if (lots.length === 0) { this.loading = false; return; }
      // Load bookings for all lots
      forkJoin(lots.map(l => this.bookingService.getByLot(l.lotId).pipe(catchError(() => of([]))))).subscribe(results => {
        this.bookings = results.flat().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        this.loading = false;
      });
    });
  }

  checkIn(b: Booking): void {
    this.bookingService.checkIn(b.bookingId).subscribe(updated => {
      const i = this.bookings.findIndex(x => x.bookingId === b.bookingId);
      if (i >= 0) this.bookings[i] = updated;
    });
  }
  checkOut(b: Booking): void {
    this.bookingService.checkOut(b.bookingId).subscribe(updated => {
      const i = this.bookings.findIndex(x => x.bookingId === b.bookingId);
      if (i >= 0) this.bookings[i] = updated;
    });
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { BookingService } from '../../../core/services/booking.service';
import { ParkingLot, Booking } from '../../../core/models/types';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private lotService = inject(ParkingLotService);
  private bookingService = inject(BookingService);

  lots: ParkingLot[] = [];
  allBookings: Booking[] = [];
  loading = true;

  get activeBookings(): Booking[] { return this.allBookings.filter(b => b.status === 'RESERVED' || b.status === 'CHECKED_IN'); }
  get revenue(): number { return this.allBookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + b.totalAmount, 0); }
  get occupancy(): number {
    const total = this.lots.reduce((s, l) => s + l.totalSpots, 0);
    const avail = this.lots.reduce((s, l) => s + l.availableSpots, 0);
    return total === 0 ? 0 : Math.round(((total - avail) / total) * 100);
  }

  ngOnInit(): void {
    const uid = this.auth.currentUser?.userId;
    if (!uid) return;
    forkJoin({
      lots: this.lotService.getByManager(uid).pipe(catchError(() => of([]))),
      bookings: this.bookingService.getActive().pipe(catchError(() => of([]))),
    }).subscribe(({ lots, bookings }) => {
      this.lots = lots;
      this.allBookings = bookings;
      this.loading = false;
    });
  }
}

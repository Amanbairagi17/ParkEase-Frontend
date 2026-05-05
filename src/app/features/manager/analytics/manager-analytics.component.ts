import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ParkingLot, Booking } from '../../../core/models/types';

@Component({
  selector: 'app-manager-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-analytics.component.html',
  styleUrls: ['./manager-analytics.component.css']
})
export class ManagerAnalyticsComponent implements OnInit {
  private auth = inject(AuthService);
  private lotService = inject(ParkingLotService);
  private bookingService = inject(BookingService);

  lots: ParkingLot[] = [];
  allBookings: Booking[] = [];
  loading = true;

  get totalRevenue(): number { return this.allBookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (b.totalAmount ?? 0), 0); }
  get completedBookings(): number { return this.allBookings.filter(b => b.status === 'COMPLETED').length; }
  get cancelledBookings(): number { return this.allBookings.filter(b => b.status === 'CANCELLED').length; }
  get occupancyRate(): number {
    const total = this.lots.reduce((s, l) => s + l.totalSpots, 0);
    const avail = this.lots.reduce((s, l) => s + l.availableSpots, 0);
    return total === 0 ? 0 : Math.round(((total - avail) / total) * 100);
  }

  get bookingBreakdown() {
    const total = this.allBookings.length || 1;
    const statuses = ['COMPLETED', 'RESERVED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED'];
    const clsMap: Record<string, string> = { COMPLETED: 'green', RESERVED: 'blue', CHECKED_IN: 'green', CANCELLED: 'red', EXPIRED: 'yellow' };
    return statuses.map(s => ({
      label: s,
      count: this.allBookings.filter(b => b.status === s).length,
      pct: Math.round((this.allBookings.filter(b => b.status === s).length / total) * 100),
      cls: clsMap[s] || 'gray'
    }));
  }

  occupancyForLot(l: ParkingLot): number {
    return l.totalSpots === 0 ? 0 : Math.round(((l.totalSpots - l.availableSpots) / l.totalSpots) * 100);
  }

  ngOnInit(): void {
    const uid = this.auth.currentUser?.userId;
    if (!uid) return;
    this.lotService.getByManager(uid).pipe(catchError(() => of([]))).subscribe(lots => {
      this.lots = lots;
      if (lots.length === 0) { this.loading = false; return; }
      forkJoin(lots.map(l => this.bookingService.getByLot(l.lotId).pipe(catchError(() => of([]))))).subscribe(results => {
        this.allBookings = results.flat();
        this.loading = false;
      });
    });
  }
}


import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/types';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['./admin-bookings.component.css']
})
export class AdminBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);

  bookings: Booking[] = [];
  loading = true;
  activeTab = 'all';

  tabs = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    // Booking tabs are grouped on the frontend; backend returns raw statuses only.
  ];

  get filtered(): Booking[] {
    if (this.activeTab === 'all') return this.bookings;
    if (this.activeTab === 'ACTIVE') {
      return this.bookings.filter(b => [
        'RESERVED',
        'ACTIVE'
      ].includes(b.status));
    }
    return this.bookings.filter(b => b.status === this.activeTab);
  }

  count(tab: string): number {
    if (tab === 'all') return this.bookings.length;
    if (tab === 'ACTIVE') {
      return this.bookings.filter(b => [
        'RESERVED',
        'ACTIVE'
      ].includes(b.status)).length;
    }
    return this.bookings.filter(b => b.status === tab).length;
  }


  ngOnInit(): void {
    this.bookingService.getActive().pipe(catchError(() => of([]))).subscribe(b => {
      this.bookings = b;
      this.loading = false;
    });
  }

  action(type: 'cancel' | 'checkIn' | 'checkOut', b: Booking): void {
    const obs = type === 'cancel'
      ? this.bookingService.cancel(b.bookingId)
      : type === 'checkIn'
        ? this.bookingService.checkIn(b.bookingId)
        : this.bookingService.checkOut(b.bookingId);
    obs.subscribe(updated => {
      const i = this.bookings.findIndex(x => x.bookingId === b.bookingId);
      if (i >= 0) this.bookings[i] = updated;
    });
  }
}

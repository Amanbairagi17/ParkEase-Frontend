import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../core/models/types';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-driver-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './driver-bookings.component.html',
  styleUrls: ['./driver-bookings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);

  bookings = signal<Booking[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<string>('all');

  tabs = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'History', value: 'HISTORY' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];


  filtered = computed(() => {
    const b = this.bookings();
    const tab = this.activeTab();

    if (tab === 'all') return b;
    if (tab === 'UPCOMING') return b.filter(x => this.isUpcomingStatus(x.status));
    if (tab === 'ACTIVE') return b.filter(x => this.isActiveStatus(x.status));
    if (tab === 'HISTORY') return b.filter(x => this.isHistoryStatus(x.status));
    if (tab === 'CANCELLED') return b.filter(x => x.status === 'CANCELLED');


    return b;
  });


  ngOnInit(): void {
    const uid = this.auth.getUserIdFromToken();
    if (!uid) {
      this.loading.set(false);
      return;
    }

    this.bookingService.getByUser(uid).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: b => this.bookings.set(Array.isArray(b) ? b : []),
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  getTabCount(tab: string): number {
    const b = this.bookings();
    if (tab === 'all') return b.length;
    if (tab === 'UPCOMING') return b.filter(x => this.isUpcomingStatus(x.status)).length;
    if (tab === 'ACTIVE') return b.filter(x => this.isActiveStatus(x.status)).length;
    if (tab === 'HISTORY') return b.filter(x => this.isHistoryStatus(x.status)).length;
    return b.filter(x => x.status === tab).length;
  }


  getDuration(booking: Booking): string {
    const startValue = booking.checkInTime || booking.startTime;
    const endValue = booking.checkOutTime || booking.endTime;
    if (!startValue || !endValue) return '--';
    const start = new Date(startValue);
    const end = new Date(endValue);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return '--';

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  getStatusClass(status: Booking['status']): string {
    if (status === 'COMPLETED') return 'status completed';
    if (status === 'ACTIVE') return 'status active';
    if (status === 'RESERVED') return 'status pending';
    if (status === 'CANCELLED') return 'status failed';
    return 'status pending';

  }

  private isUpcomingStatus(status: Booking['status']): boolean {
    return ['RESERVED'].includes(status);
  }

  private isActiveStatus(status: Booking['status']): boolean {
    return ['ACTIVE'].includes(status);
  }

  private isHistoryStatus(status: Booking['status']): boolean {
    return ['COMPLETED'].includes(status);
  }


}


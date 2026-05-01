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
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  filtered = computed(() => {
    const b = this.bookings();
    const tab = this.activeTab();
    if (tab === 'all') return b;
    if (tab === 'ACTIVE') return b.filter(x => x.status === 'RESERVED' || x.status === 'CHECKED_IN');
    return b.filter(x => x.status === tab);
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
      next: b => this.bookings.set(b),
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  getTabCount(tab: string): number {
    const b = this.bookings();
    if (tab === 'all') return b.length;
    if (tab === 'ACTIVE') return b.filter(x => x.status === 'RESERVED' || x.status === 'CHECKED_IN').length;
    return b.filter(x => x.status === tab).length;
  }
}

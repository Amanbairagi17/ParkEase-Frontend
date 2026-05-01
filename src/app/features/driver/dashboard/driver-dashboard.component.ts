import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of, finalize, Observable, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking, Payment, Vehicle, Notification } from '../../../core/models/types';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent],
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private bookingService = inject(BookingService);
  private vehicleService = inject(VehicleService);
  private paymentService = inject(PaymentService);
  notificationService = inject(NotificationService);

  loading = signal<boolean>(true);
  
  // Data Observables for Async Pipe (Performance)
  allBookings$: Observable<Booking[]> = of([]);
  activeBookings$: Observable<Booking[]> = of([]);
  recentNotifications$: Observable<Notification[]> = this.notificationService.notifications$.pipe(
    map(n => n.slice(0, 3))
  );
  
  stats = signal({
    totalBookings: 0,
    activeVehicles: 0,
    totalSpent: 0
  });

  get firstName(): string {
    return this.auth.currentUser?.fullName?.split(' ')?.[0] || 'Driver';
  }

  ngOnInit(): void {
    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.notificationService.refresh();

    forkJoin({
      bookings: this.bookingService.getByUser(userId.toString()).pipe(catchError(() => of([]))),
      vehicles: this.vehicleService.getByOwner(userId.toString()).pipe(catchError(() => of([]))),
      payments: this.paymentService.getByUser(userId.toString()).pipe(catchError(() => of([]))),
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(({ bookings, vehicles, payments }) => {
      this.allBookings$ = of(bookings);
      this.activeBookings$ = of(bookings.filter(b => b.status === 'RESERVED' || b.status === 'CHECKED_IN'));
      
      this.stats.set({
        totalBookings: bookings.length,
        activeVehicles: vehicles.length,
        totalSpent: payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
      });
    });
  }

  getIcon(type: string): string {
    switch (type.toUpperCase()) {
      case 'BOOKING': return 'event_available';
      case 'PAYMENT': return 'payments';
      case 'EXPIRY': return 'timer';
      default: return 'notifications';
    }
  }
}
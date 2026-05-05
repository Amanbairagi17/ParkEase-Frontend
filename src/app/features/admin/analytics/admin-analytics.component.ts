import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { Booking, Payment, Vehicle } from '../../../core/models/types';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.css']
})
export class AdminAnalyticsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private vehicleService = inject(VehicleService);

  bookings: Booking[] = [];
  payments: Payment[] = [];
  vehicles: Vehicle[] = [];
  loading = true;

  get stats() {
    return [
      { label: 'Total bookings', value: this.bookings.length, icon: 'event', cls: 'primary' },
      { label: 'Active now', value: this.bookings.filter(b => b.status === 'CHECKED_IN' || b.status === 'RESERVED').length, icon: 'sensors', cls: 'green' },
      { label: 'Total revenue', value: '₹' + this.payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(0), icon: 'payments', cls: 'blue' },
      { label: 'Registered vehicles', value: this.vehicles.length, icon: 'directions_car', cls: 'orange' },
      { label: 'Pending payments', value: this.payments.filter(p => p.status === 'PENDING').length, icon: 'pending', cls: 'purple' },
      { label: 'Cancellations', value: this.bookings.filter(b => b.status === 'CANCELLED').length, icon: 'cancel', cls: 'red' },
    ];
  }

  get bookingBreakdown() {
    const total = this.bookings.length || 1;
    return ['COMPLETED', 'RESERVED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED'].map(s => ({
      label: s, count: this.bookings.filter(b => b.status === s).length,
      pct: Math.round((this.bookings.filter(b => b.status === s).length / total) * 100),
      cls: ({ COMPLETED: 'green', RESERVED: 'blue', CHECKED_IN: 'green', CANCELLED: 'red', EXPIRED: 'yellow' } as any)[s] || 'gray'
    }));
  }

  get vehicleBreakdown() {
    const total = this.vehicles.length || 1;
    const types = [
      { id: 'TWO_WHEELER', label: 'Two Wheeler' },
      { id: 'THREE_WHEELER', label: 'Three Wheeler' },
      { id: 'FOUR_WHEELER', label: 'Four Wheeler' },
      { id: 'HEAVY', label: 'Heavy' }
    ];
    return types.map(t => ({
      label: t.label,
      count: this.vehicles.filter(v => v.vehicleType === (t.id as any)).length,
      pct: Math.round((this.vehicles.filter(v => v.vehicleType === (t.id as any)).length / total) * 100)
    }));
  }

  get paymentBreakdown() {
    const total = this.payments.length || 1;
    return ['CARD', 'UPI', 'WALLET', 'CASH'].map(m => ({
      label: m, count: this.payments.filter(p => p.mode === m).length,
      pct: Math.round((this.payments.filter(p => p.mode === m).length / total) * 100)
    }));
  }

  ngOnInit(): void {
    forkJoin({
      bookings: this.bookingService.getActive().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of([]))),
      vehicles: this.vehicleService.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ bookings, payments, vehicles }) => {
      this.bookings = bookings;
      this.payments = payments;
      this.vehicles = vehicles;
      this.loading = false;
    });
  }
}

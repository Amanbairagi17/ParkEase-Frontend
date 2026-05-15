import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of, finalize } from 'rxjs';

import { BookingService } from '../../../core/services/booking.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AdminService } from '../../../core/services/admin.service';
import { AdminStats, Booking, Payment } from '../../../core/models/types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  stats: AdminStats | null = null;
  allBookings: Booking[] = [];
  payments: Payment[] = [];
  loading = true;

  get activeBookings(): Booking[] {
    return this.allBookings.filter(b => [
      'RESERVED',
      'ACTIVE'
    ].includes(b?.status));
  }

  get totalRevenue(): number {
    return this.payments
      .filter(p => p?.status === 'SUCCESS')
      .reduce((s, p) => s + Number(p?.amount || 0), 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    forkJoin({
      stats: this.adminService.getStats().pipe(catchError(() => of(null))),
      bookings: this.bookingService.getActive().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of([]))),
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(({ stats, bookings, payments }) => {
      this.stats = stats;
      this.allBookings = this.extractArray(bookings);
      this.payments = this.extractArray(payments);
      this.cdr.detectChanges();
    });
  }

  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    return [];
  }
}

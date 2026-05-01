import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/types';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonLoaderComponent],
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  booking$: Observable<Booking | null> = of(null);
  loading = true;
  processing = false;
  actionError = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBooking(id);
    }
  }

  loadBooking(id: string): void {
    this.loading = true;
    this.booking$ = this.bookingService.getById(id).pipe(
      tap(() => this.loading = false),
      catchError(err => {
        this.loading = false;
        this.actionError = 'Failed to load booking details.';
        return of(null);
      })
    );
  }

  cancelBooking(): void {
    // Implementation
  }

  checkIn(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.processing = true;
    this.bookingService.checkIn(id).pipe(
      finalize(() => this.processing = false)
    ).subscribe({
      next: () => {
        this.toast.success('Successfully checked in!');
        this.notificationService.refresh();
        this.loadBooking(id);
      },
      error: (e) => this.toast.error(e?.error?.message || 'Check-in failed')
    });
  }

  checkOut(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.processing = true;
    this.bookingService.checkOut(id).pipe(
      finalize(() => this.processing = false)
    ).subscribe({
      next: () => {
        this.toast.success('Successfully checked out!');
        this.notificationService.refresh();
        this.loadBooking(id);
      },
      error: (e) => this.toast.error(e?.error?.message || 'Check-out failed')
    });
  }
}

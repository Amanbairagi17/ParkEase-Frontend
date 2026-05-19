import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Booking } from '../../../core/models/types';
import { ToastService } from '../../../core/services/toast.service';
import { finalize } from 'rxjs';
import { NewBookingComponent } from '../new-booking/new-booking.component';

declare var Razorpay: any;

@Component({
  selector: 'app-driver-bookings',
  standalone: true,
  imports: [CommonModule, NewBookingComponent],
  templateUrl: './driver-bookings.component.html',
  styleUrls: ['./driver-bookings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private route = inject(ActivatedRoute);

  bookings = signal<Booking[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<string>('all');
  selectedBooking = signal<Booking | null>(null);
  actionLoading = signal<boolean>(false);
  showNewBookingModal = signal<boolean>(false);

  openNewBookingModal() {
    this.showNewBookingModal.set(true);
  }

  closeNewBookingModal() {
    this.showNewBookingModal.set(false);
  }

  openBookingDetails(b: Booking) {
    this.selectedBooking.set(b);
  }

  closeBookingDetails() {
    this.selectedBooking.set(null);
  }

  checkIn(booking: Booking): void {
    this.actionLoading.set(true);
    this.bookingService.checkIn(booking.bookingId).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: (updated) => {
        this.toast.success('Successfully checked in!');
        this.bookings.update(list => list.map(b => b.bookingId === booking.bookingId ? { ...b, ...updated } : b));
        this.selectedBooking.set({ ...booking, ...updated });
      },
      error: (e) => this.toast.error(e?.error?.message || 'Check-in failed')
    });
  }

  cancelBooking(booking: Booking): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    this.actionLoading.set(true);
    this.bookingService.cancel(booking.bookingId).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: (updated) => {
        this.toast.success('Successfully cancelled reservation!');
        this.bookings.update(list => list.map(b => b.bookingId === booking.bookingId ? { ...b, ...updated } : b));
        this.selectedBooking.set({ ...booking, ...updated });
      },
      error: (e) => this.toast.error(e?.error?.message || 'Cancellation failed')
    });
  }

  checkOut(booking: Booking): void {
    this.actionLoading.set(true);
    this.toast.info('Finalizing amount...');
    this.bookingService.checkOut(booking.bookingId).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: (updated) => {
        this.toast.success('Successfully checked out!');
        this.bookings.update(list => list.map(b => b.bookingId === booking.bookingId ? { ...b, ...updated } : b));
        this.selectedBooking.set({ ...booking, ...updated });

        const finalAmount = updated.totalAmount;
        if (finalAmount <= 0) {
          return;
        }

        // Trigger payment flow
        this.payNow(updated);
      },
      error: (e) => this.toast.error(e?.error?.message || 'Check-out failed')
    });
  }

  payNow(booking: Booking): void {
    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.toast.error('Please login to make payment');
      return;
    }

    this.actionLoading.set(true);

    const request = {
      bookingId: booking.bookingId,
      mode: 'UPI' as const
    };

    this.paymentService.createOrder(request).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: (order) => {
        const options = {
          key: order.key || 'rzp_test_placeholder',
          amount: Math.round(Number(booking.totalAmount) * 100),
          currency: order.currency,
          name: 'ParkEase',
          description: `Parking for ${booking.vehiclePlate}`,
          order_id: order.orderId,
          handler: (response: any) => {
            this.ngZone.run(() => {
              const verifyData = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              };

              this.actionLoading.set(true);
              this.paymentService.verifyPayment(verifyData).pipe(
                finalize(() => this.actionLoading.set(false))
              ).subscribe({
                next: (res) => {
                  this.toast.success('Payment verified successfully!');
                  
                  // Update local bookings list
                  const completedBooking = { ...booking, status: 'COMPLETED' as const, isPaid: true };
                  this.bookings.update(list => list.map(b => b.bookingId === booking.bookingId ? completedBooking : b));
                  this.selectedBooking.set(completedBooking);

                  const paymentId = res?.paymentId;
                  if (paymentId) {
                    this.router.navigate(['/receipts/payment-success'], {
                      queryParams: { paymentId }
                    });
                  }
                },
                error: (err) => {
                  this.toast.error(err?.error?.message || 'Payment verification failed.');
                }
              });
            });
          },
          prefill: {
            name: 'User',
            email: 'user@example.com'
          },
          theme: { color: '#6366f1' }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Payment initialization failed.');
      }
    });
  }

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

    this.route.queryParamMap.subscribe(params => {
      if (params.get('openNewBooking') === 'true') {
        this.openNewBookingModal();
      }
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


import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/types';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, finalize, Observable, of } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  booking$: Observable<Booking | null> = of(null);
  loading = true;
  processing = false;
  actionError = '';
  showExtendModal = false;
  extensionTime = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBooking(id);
    }
  }

  loadBooking(id: string | number): void {
    this.loading = true;
    this.actionError = '';
    this.booking$ = this.bookingService.getById(id).pipe(
      finalize(() => this.loading = false),
      catchError(err => {
        console.error('Booking load error:', err);
        const errorMsg = err.error?.message || err.message || 'Booking details could not be loaded.';
        this.actionError = errorMsg.includes('not found') ? 'Booking not found' : errorMsg;
        return of(null);
      })
    );
  }

  cancelBooking(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.processing = true;
    this.bookingService.cancel(id).pipe(
      finalize(() => this.processing = false)
    ).subscribe({
      next: () => {
        this.toast.success('Successfully cancelled booking!');
        this.notificationService.refresh();
        this.loadBooking(id);
      },
      error: (e) => this.toast.error(e?.error?.message || 'Cancellation failed')
    });
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

  qrCodeUrl = '';

  payNow(booking: Booking): void {
    const userId = this.authService.getUserIdFromToken();
    if (!userId) {
      this.toast.error('Please login to make payment');
      return;
    }
    const amount = Number(booking.amount ?? booking.totalAmount ?? 0);
    if (amount <= 0) {
      this.toast.error('Payment amount cannot be zero.');
      return;
    }

    this.processing = true;
    this.paymentService.createOrder({
      bookingId: booking.bookingId
    }).subscribe({
      next: (order: any) => {
        this.processing = false;
        this.openRazorpay(order, booking);
        this.generateQRCode(booking);
      },
      error: (e) => {
        this.processing = false;
        this.toast.error('Failed to initialize payment');
      }
    });
  }

  generateQRCode(booking: Booking): void {
    const amount = Number(booking.amount ?? booking.totalAmount ?? 0);
    const upiLink = `upi://pay?pa=parkease@upi&pn=ParkEase&am=${amount}&cu=INR&tn=Booking_${booking.bookingId}`;
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
  }

  private openRazorpay(order: any, booking: Booking): void {
    const options = {
      key: order.key || 'rzp_test_placeholder',
      amount: order.amount,
      currency: order.currency,
      name: 'ParkEase',
      description: `Parking for ${booking.vehiclePlate}`,
      order_id: order.orderId,
      handler: (response: any) => {
        this.verifyPayment(response, booking.bookingId);
      },
      prefill: {
        name: 'User',
        email: 'user@example.com'
      },
      theme: { color: '#6366f1' }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  private verifyPayment(response: any, bookingId: number | string): void {
    this.processing = true;
    this.paymentService.verifyPayment({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    }).subscribe({
      next: () => {
        this.toast.success('Payment Successful!');
        this.notificationService.refresh();
        setTimeout(() => this.loadBooking(bookingId), 1000);
        this.processing = false;
      },
      error: () => {
        this.toast.error('Payment verification failed');
        this.processing = false;
      }
    });
  }

  extendStay(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.extensionTime) return;

    this.processing = true;
    this.bookingService.extend(id, new Date(this.extensionTime).toISOString()).pipe(
      finalize(() => {
        this.processing = false;
        this.showExtendModal = false;
      })
    ).subscribe({
      next: () => {
        this.toast.success('Booking extended successfully!');
        this.notificationService.refresh();
        this.loadBooking(id);
      },
      error: (e) => this.toast.error(e?.error?.message || 'Extension failed')
    });
  }
}

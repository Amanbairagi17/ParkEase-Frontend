import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, Payment, Receipt, RazorpayOrder } from '../../../core/models/types';
import { PaymentService } from '../../../core/services/payment.service';
import { ReceiptService } from '../../../core/services/receipt.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { isSuccessfulPaymentStatus } from '../../../core/utils/payment-status';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReceiptDownloadComponent } from '../../receipt/receipt-download/receipt-download.component';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReceiptDownloadComponent],
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
  private receiptService = inject(ReceiptService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  booking$: Observable<Booking | null> = of(null);
  loading = true;
  processing = false;
  actionError = '';
  showExtendModal = false;
  extensionTime = '';
  payment: Payment | null = null;
  receipt: Receipt | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBooking(id);
    }
  }

  loadBooking(id: string | number, opts?: { silent?: boolean }): void {
    if (!opts?.silent) {
      this.loading = true;
    }
    this.actionError = '';

    // Ensure UI is never stuck behind receipt state from a previous booking.
    // Receipt fetch is intentionally NOT part of the payment-success flow.
    this.receipt = null;

    this.booking$ = this.bookingService.getById(id).pipe(
      switchMap(booking => {
        if (!booking) {
          this.payment = null;
          this.receipt = null;
          return of(null);
        }

        return this.paymentService.getByBooking(booking.bookingId).pipe(
          catchError(err => {
            console.warn('[BookingDetail] payment by booking failed', { bookingId: booking.bookingId, err });
            return of(null);
          }),
          tap(payment => {
            this.payment = payment;
          }),
          map(() => booking)
        );
      }),
      tap(() => this.cdr.markForCheck()),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
      catchError(err => {
        const errorMsg = err.error?.message || err.message || 'Booking details could not be loaded.';
        this.actionError = errorMsg.includes('not found') ? 'Booking not found' : errorMsg;
        this.payment = null;
        this.receipt = null;
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
        this.loadBooking(id, { silent: true });
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
        this.loadBooking(id, { silent: true });
      },
      error: (e) => this.toast.error(e?.error?.message || 'Check-in failed')
    });
  }

  checkOut(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.processing = true;
    this.toast.info('Finalizing amount...');

    // 1. Call checkout (initiation) to update final amount in DB
    this.bookingService.checkOut(id).pipe(
      finalize(() => this.processing = false)
    ).subscribe({
      next: (updatedBooking) => {
        const finalAmount = updatedBooking.totalAmount;
        if (finalAmount <= 0) {
          this.toast.success('Successfully checked out!');
          this.loadBooking(id, { silent: true });
          return;
        }

        // 2. Open Razorpay with the final amount
        this.payNowInternal(updatedBooking, finalAmount).subscribe();
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to initiate checkout')
    });
  }


  /**
   * Fetch latest booking, pay remaining due (if any) and retry checkout.
   */
  private openAndPayRemainingThenRetry(bookingId: string | number): void {
    this.bookingService.getById(bookingId).pipe(
      catchError(() => of(null as any)),
      switchMap((booking: Booking | null) => {
        if (!booking) return of(null);

        const remaining = this.getRemainingDue(booking);
        if (remaining <= 0) {
          // Nothing pending; retry checkout immediately.
          return of(booking).pipe(tap(() => this.checkOut()));
        }

        // Trigger payment for remaining due
        this.toast.info(`Pay pending amount ₹${remaining.toFixed(2)}`);
        // Razorpay amount is set via payNowInternal.
        return this.payNowInternal(booking, remaining).pipe(
          tap(() => {
            // After verification and booking refresh, retry checkout.
            this.loadBooking(bookingId, { silent: true });
            this.checkOut();
          })
        );
      })
    ).subscribe();
  }

  getRemainingDue(booking: Booking): number {
    // Prefer backend-provided remainingAmount if present.
    const remaining = booking.remainingAmount ?? booking.pendingAmount;
    if (remaining != null && !Number.isNaN(Number(remaining))) {
      return Number(remaining);
    }

    // Fallback if backend provides final/paid amounts.
    const finalAmount = booking.finalAmount;
    const paidAmount = booking.paidAmount;
    if (finalAmount != null && paidAmount != null) {
      const diff = Number(finalAmount) - Number(paidAmount);
      return diff > 0 ? diff : 0;
    }

    // Last resort: attempt to treat totalAmount as final.
    // (Avoids blocking user if backend doesn’t yet send remaining fields.)
    const paid = booking.amount ?? booking.paidAmount;
    const total = booking.finalAmount ?? booking.totalAmount;
    if (paid != null && total != null) {
      const diff = Number(total) - Number(paid);
      return diff > 0 ? diff : 0;
    }

    return 0;
  }



  private loadReceiptByPaymentIdNonFatal(paymentId: string | number): void {
    this.receiptService.getReceiptByPaymentId(paymentId).pipe(
      tap(() => console.log('[BookingDetail] fetching receipt by paymentId', paymentId)),
      catchError(err => {
        const status = err?.status ?? err?.error?.status;
        const msg = err?.error?.message || err?.message;
        // Backend may return 404 while receipt is still generating.
        if (status === 404 || (msg && msg.toLowerCase().includes('receipt')) || (msg && msg.toLowerCase().includes('not found'))) {
          console.info('[BookingDetail] receipt not ready yet (treated as non-fatal)', { paymentId, status, msg });
          return of(null);
        }
        console.warn('[BookingDetail] receipt fetch failed (non-fatal)', { paymentId, status, msg, err });
        return of(null);
      })
    ).subscribe({
      next: (receipt) => {
        if (receipt) {
          this.receipt = receipt;
          this.cdr.markForCheck();
        }
      }
    });
  }

  qrCodeUrl = '';

  payNow(booking: Booking): void {
    // Back-compat: pay remaining due if available; otherwise use old amount logic.
    const remaining = this.getRemainingDue(booking);
    const amount = remaining > 0 ? remaining : Number(booking.amount ?? booking.totalAmount ?? 0);

    if (amount <= 0) {
      this.toast.error('Payment amount cannot be zero.');
      return;
    }

    // Use remaining payment internal flow.
    this.payNowInternal(booking, amount).subscribe();
  }

  private payNowInternal(booking: Booking, amount: number): Observable<void> {
    const userId = this.authService.getUserIdFromToken();
    if (!userId) {
      this.toast.error('Please login to make payment');
      return of(void 0);
    }

    this.processing = true;
    return this.paymentService.createOrder({
      bookingId: booking.bookingId,
      mode: 'UPI'
    }).pipe(
      switchMap((order: RazorpayOrder) => {
        this.processing = false;

        // Razorpay UI triggers verifyPayment; verifyPayment refreshes booking.
        this.openRazorpay(order, booking, amount);
        this.generateQRCodeWithAmount(booking, amount);
        this.cdr.markForCheck();

        // Return immediately; completion is handled by verifyPayment path.
        return of(void 0);
      }),
      catchError((e) => {
        this.processing = false;
        this.toast.error(e?.error?.message || 'Failed to initialize payment');
        this.cdr.markForCheck();
        return of(void 0);
      })
    );
  }


  // Back-compat: kept for any template usage.
  generateQRCode(booking: Booking): void {
    const amount = this.getRemainingDue(booking) > 0
      ? this.getRemainingDue(booking)
      : Number(booking.amount ?? booking.totalAmount ?? 0);
    this.generateQRCodeWithAmount(booking, amount);
  }

  private generateQRCodeWithAmount(booking: Booking, amount: number): void {
    const upiLink = `upi://pay?pa=parkease@upi&pn=ParkEase&am=${amount}&cu=INR&tn=Booking_${booking.bookingId}`;
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
  }

  private openRazorpay(order: RazorpayOrder, booking: Booking, forcedAmount: number): void {

    // Some backend order creation may already contain correct amount.
    // We still set Razorpay options amount to match the remaining due we intend to pay.
    const options = {
      key: order.key || 'rzp_test_placeholder',
      amount: Math.round(Number(forcedAmount) * 100),
      currency: order.currency,
      name: 'ParkEase',
      description: `Parking for ${booking.vehiclePlate}`,
      order_id: order.orderId,
      handler: (response: any) => {
        this.ngZone.run(() => this.verifyPayment(response, booking.bookingId));
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
    // Payment verification must ONLY synchronize payment/bookings.
    // Receipt generation/loading must NEVER block UI or checkout eligibility.
    this.processing = true;

    this.paymentService.verifyPayment({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    }).subscribe({
      next: (confirmed: Payment) => {
        this.ngZone.run(() => {
          console.log('[BookingDetail] verifyPayment success', {
            bookingId,
            paymentId: confirmed?.paymentId,
            status: confirmed?.status
          });

          this.toast.success('Payment Successful!');
          this.notificationService.refresh();

          // Ensure checkout eligibility updates immediately.
          this.payment = confirmed;

          // Refresh booking & payment state; do not attempt any receipt fetch here.
          this.loadBooking(bookingId, { silent: true });

          this.processing = false;
          this.cdr.markForCheck();
        });
      },
      error: (e) => {
        this.ngZone.run(() => {
          console.warn('[BookingDetail] verifyPayment failed', { bookingId, err: e });
          this.toast.error(e?.error?.message || 'Payment verification failed');
          this.processing = false;
          this.cdr.markForCheck();
        });
      }
    });
  }


  extendStay(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.extensionTime) return;

    this.processing = true;
    this.bookingService.extend(id, this.normalizeLocalDateTime(this.extensionTime)).pipe(
      finalize(() => {
        this.processing = false;
        this.showExtendModal = false;
      })
    ).subscribe({
      next: () => {
        this.toast.success('Booking extended successfully!');
        this.notificationService.refresh();
        this.loadBooking(id, { silent: true });
      },
      error: (e) => this.toast.error(e?.error?.message || 'Extension failed')
    });
  }

  isPaid(booking: Booking): boolean {
    return (
      booking.isPaid ||
      isSuccessfulPaymentStatus(this.payment?.status) ||
      booking.status === 'COMPLETED'
    );
  }

  canCancel(booking: Booking): boolean {
    return booking.status === 'RESERVED';
  }

  canCheckIn(booking: Booking): boolean {
    return booking.status === 'RESERVED';
  }

  canExtend(booking: Booking): boolean {
    return booking.status === 'ACTIVE';
  }

  canCheckout(booking: Booking): boolean {
    return booking.status === 'ACTIVE';
  }

  canPay(booking: Booking): boolean {
    return false; // Payment is now integrated into checkout
  }


  private normalizeLocalDateTime(value: string): string {
    if (!value) return value;
    return value.length === 16 ? `${value}:00` : value;
  }

}

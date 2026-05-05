import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Payment } from '../../../core/models/types';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { finalize } from 'rxjs';

declare var Razorpay: any;

@Component({
  selector: 'app-driver-payments',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './driver-payments.component.html',
  styleUrls: ['./driver-payments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverPaymentsComponent implements OnInit {

  private paymentService = inject(PaymentService);
  private auth = inject(AuthService);

  payments = signal<Payment[]>([]);
  loading = signal<boolean>(true);
  processing = signal<boolean>(false);

  get totalPaid(): number {
    return this.payments()
      .filter(p => p.status === 'SUCCESS')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }

  ngOnInit(): void {
    this.refreshPayments();
  }

  refreshPayments() {
    const uid = this.auth.getUserIdFromToken();
    if (!uid) {
      this.loading.set(false);
      return;
    }

    this.paymentService.getByUser(uid).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: p => this.payments.set(Array.isArray(p) ? p : []),
      error: () => this.loading.set(false)
    });
  }

  payNow(payment: Payment) {
  const userId = this.auth.getUserIdFromToken();
  if (!userId) return;

  this.processing.set(true);

  const request = {
    bookingId: payment.bookingId,
    userId: userId,
    amount: payment.amount
  };

  this.paymentService.createOrder(request).subscribe({
    next: (order: any) => {

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,

        handler: (response: any) => {

          const verifyData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          };

          this.paymentService.verifyPayment(verifyData).subscribe({
            next: () => {
              this.processing.set(false);
              this.refreshPayments();
            },
            error: () => this.processing.set(false)
          });
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

      this.processing.set(false);
    },
    error: () => this.processing.set(false)
  });
}

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'status success';
      case 'FAILED':
        return 'status failed';
      case 'PENDING':
        return 'status pending';
      default:
        return 'status';
    }
  }
}

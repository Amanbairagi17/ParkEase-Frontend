import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Payment } from '../../../core/models/types';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state.component';
import { finalize } from 'rxjs';

declare var Razorpay: any;

@Component({
  selector: 'app-driver-payments',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './driver-payments.component.html',
  styleUrls: ['./driver-payments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverPaymentsComponent implements OnInit {

  private paymentService = inject(PaymentService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

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
      mode: 'UPI' as const
    };

    this.paymentService.createOrder(request).subscribe({
      next: (order) => {
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
              next: (res) => {
                this.processing.set(false);
                this.refreshPayments();
                const paymentId = res?.paymentId;
                if (paymentId) {
                  this.router.navigate(['/receipts/payment-success'], {
                    queryParams: { paymentId }
                  });
                } else {
                  this.toast.success('Payment verified.');
                }
              },
              error: (err) => {
                this.processing.set(false);
                this.toast.error(err?.error?.message || 'Payment verification failed.');
              }
            });
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();

        this.processing.set(false);
      },
      error: (err) => {
        this.processing.set(false);
        this.toast.error(err?.error?.message || 'Payment initialization failed.');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'status success';
      case 'FAILED':
        return 'status failed';
      default:
        return 'status';
    }
  }
}


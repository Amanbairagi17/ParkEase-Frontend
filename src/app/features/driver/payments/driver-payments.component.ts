import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Payment } from '../../../core/models/types';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { finalize } from 'rxjs';

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

  get totalPaid(): number { 
    return this.payments()
      .filter(p => p.status === 'COMPLETED')
      .reduce((s, p) => s + p.amount, 0); 
  }

  ngOnInit(): void {
    const uid = this.auth.getUserIdFromToken();
    if (!uid) {
      this.loading.set(false);
      return;
    }

    this.paymentService.getByUser(uid).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: p => this.payments.set(p),
      error: () => this.loading.set(false),
    });
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}

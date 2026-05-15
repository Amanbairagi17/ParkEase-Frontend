import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { Payment } from '../../../core/models/types';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-payments.component.html',
  styleUrls: ['./admin-payments.component.css']
})
export class AdminPaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments: Payment[] = [];
  loading = true;

  get revenue(): number { return this.payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + Number(p.amount || 0), 0); }
  get pending(): number { return this.payments.filter(p => p.status === 'SUCCESS').length; }


  get refunded(): number { return this.payments.filter(p => p.status === 'REFUNDED').length; }


  ngOnInit(): void {
    this.paymentService.getAll().pipe(catchError(() => of([]))).subscribe(p => {
      this.payments = p;
      this.loading = false;
    });
  }

  refund(p: Payment): void {
    if (!confirm('Process refund for this payment?')) return;
    this.paymentService.refund(p.paymentId).subscribe(updated => {
      const i = this.payments.findIndex(x => x.paymentId === p.paymentId);
      if (i >= 0) this.payments[i] = updated;
    });
  }
}

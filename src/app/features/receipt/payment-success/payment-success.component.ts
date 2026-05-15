import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReceiptService } from '../../../core/services/receipt.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Receipt } from '../../../core/models/types';
import { ReceiptDownloadComponent } from '../receipt-download/receipt-download.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, ReceiptDownloadComponent],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private receiptService = inject(ReceiptService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  loading = signal<boolean>(true);
  message = signal<string>('Generating your receipt...');
  receipt = signal<Receipt | null>(null);

  ngOnInit(): void {
    const paymentIdParam = this.route.snapshot.queryParamMap.get('paymentId');
    const paymentId = paymentIdParam ? Number(paymentIdParam) : null;
    const userId = this.auth.getUserIdFromToken();

    if (!paymentId || !userId) {
      this.loading.set(false);
      this.message.set('Invalid payment details.');
      return;
    }

    this.receiptService.waitForReceiptByPaymentId(userId, paymentId).subscribe({
      next: receipt => {
        this.toast.success('Receipt generated successfully.');
        this.receipt.set(receipt);
        this.loading.set(false);
        this.message.set('Your payment is confirmed and the receipt is ready.');
      },
      error: () => {
        this.loading.set(false);
        this.message.set('Receipt generation is taking longer than usual. Please check your history.');
      }
    });
  }

  viewReceipt(): void {
    const receipt = this.receipt();
    if (receipt) {
      this.router.navigate(['/receipts', receipt.receiptId]);
    }
  }
}

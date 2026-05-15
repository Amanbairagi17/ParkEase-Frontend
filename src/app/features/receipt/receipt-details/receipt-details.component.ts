import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Receipt } from '../../../core/models/types';
import { ReceiptService } from '../../../core/services/receipt.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ReceiptDownloadComponent } from '../receipt-download/receipt-download.component';

@Component({
  selector: 'app-receipt-details',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonLoaderComponent, ReceiptDownloadComponent],
  templateUrl: './receipt-details.component.html',
  styleUrls: ['./receipt-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private receiptService = inject(ReceiptService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  receipt = signal<Receipt | null>(null);
  userName = signal<string>('');
  userEmail = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.userName.set(this.auth.currentUser?.fullName || '');
    this.userEmail.set(this.auth.currentUser?.email || '');
    const receiptId = this.route.snapshot.paramMap.get('receiptId');
    if (!receiptId) {
      this.error.set('Receipt id is missing.');
      this.loading.set(false);
      return;
    }

    this.receiptService.getReceiptById(receiptId).subscribe({
      next: r => {
        this.receipt.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Receipt not found or access denied.');
        this.loading.set(false);
        this.toast.error('Unable to load receipt.');
      }
    });
  }
}

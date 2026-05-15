import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Receipt } from '../../../core/models/types';
import { AuthService } from '../../../core/services/auth.service';
import { ReceiptStateService } from '../state/receipt-state.service';
import { ReceiptCardComponent } from '../receipt-card/receipt-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-receipt-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReceiptCardComponent, SkeletonLoaderComponent],
  templateUrl: './receipt-list.component.html',
  styleUrls: ['./receipt-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptListComponent implements OnInit {
  private auth = inject(AuthService);
  private state = inject(ReceiptStateService);

  receipts = signal<Receipt[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.error.set('Please login to view receipts.');
      this.loading.set(false);
      return;
    }

    this.state.receipts$.subscribe(state => {
      this.receipts.set(state.receipts);
      this.loading.set(state.loading);
      this.error.set(state.error);
    });

    this.state.loadUserReceipts(userId);
  }

  get recentReceipts(): Receipt[] {
    return this.receipts().slice(0, 4);
  }
}

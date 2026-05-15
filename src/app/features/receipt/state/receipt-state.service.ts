import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { Receipt } from '../../../core/models/types';
import { ReceiptService } from '../../../core/services/receipt.service';

interface ReceiptState {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReceiptStateService {
  private state$ = new BehaviorSubject<ReceiptState>({
    receipts: [],
    loading: false,
    error: null
  });

  readonly receipts$ = this.state$.asObservable();

  constructor(private receiptService: ReceiptService) {}

  loadUserReceipts(userId: number) {
    this.setState({ loading: true, error: null });
    this.receiptService.getUserReceipts(userId).pipe(
      finalize(() => this.setState({ loading: false }))
    ).subscribe({
      next: receipts => this.setState({ receipts: receipts || [] }),
      error: () => this.setState({ error: 'Failed to load receipts.' })
    });
  }

  clear() {
    this.state$.next({ receipts: [], loading: false, error: null });
  }

  private setState(patch: Partial<ReceiptState>) {
    this.state$.next({ ...this.state$.value, ...patch });
  }
}

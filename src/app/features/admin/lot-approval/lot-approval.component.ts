import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ParkingLot } from '../../../core/models/types';
import { catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-lot-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lot-approval.component.html',
  styleUrls: ['./lot-approval.component.css']
})
export class LotApprovalComponent implements OnInit {
  private lotService = inject(ParkingLotService);
  private cdr = inject(ChangeDetectorRef);

  allLots: ParkingLot[] = [];
  loading = true;
  activeTab: 'pending' | 'approved' = 'pending';
  processing: string | null = null;

  get pending(): ParkingLot[] { return this.allLots.filter(l => !l.approved); }
  get approved(): ParkingLot[] { return this.allLots.filter(l => l.approved); }
  get currentList(): ParkingLot[] { return this.activeTab === 'pending' ? this.pending : this.approved; }

  ngOnInit(): void {
    console.log('[LotApproval] Initializing admin view...');
    this.loading = true;
    
    this.lotService.search('')
      .pipe(
        catchError((err) => {
          console.error('[LotApproval] Load error:', err);
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(lots => {
        console.log('[LotApproval] Data loaded:', lots.length, 'lots');
        this.allLots = [...lots];
        this.cdr.detectChanges();
      });
  }

  approve(lot: ParkingLot): void {
    this.processing = lot.lotId;
    this.lotService.update(lot.lotId, { ...lot, approved: true } as any)
      .pipe(finalize(() => {
        this.processing = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: updated => {
          console.log('[LotApproval] Approved lot:', lot.lotId);
          const i = this.allLots.findIndex(l => l.lotId === lot.lotId);
          if (i >= 0) this.allLots[i] = { ...this.allLots[i], approved: true };
          this.cdr.detectChanges();
        },
        error: () => alert('Failed to approve lot.')
      });
  }

  reject(lot: ParkingLot): void {
    if (!confirm('Delete this lot submission?')) return;
    this.processing = lot.lotId;
    this.lotService.delete(lot.lotId).subscribe({
      next: () => {
        this.allLots = this.allLots.filter(l => l.lotId !== lot.lotId);
        this.processing = null;
      },
      error: () => {
        alert('Failed to reject lot.');
        this.processing = null;
      }
    });
  }
}

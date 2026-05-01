import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingLot } from '../../../core/models/types';

@Component({
  selector: 'app-manager-lots',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-lots.component.html',
  styleUrls: ['./manager-lots.component.css']
})
export class ManagerLotsComponent implements OnInit {

  private lotService = inject(ParkingLotService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  lots: ParkingLot[] = [];
  loading = true;
  expandedLotId: string | number | null = null;

  ngOnInit(): void {
    const uid = this.auth.getUserIdFromToken();
    if (!uid) {
      console.warn('[ManagerLots] No user ID found in token');
      this.loading = false;
      return;
    }

    console.log('[ManagerLots] Fetching lots for manager:', uid);
    this.loading = true;
    
    this.lotService.getByManager(uid)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          const data = this.extractArray(res);
          console.log('[ManagerLots] Data received success. Count:', data.length);
          this.lots = [...data];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[ManagerLots] API Failure:', err);
          this.cdr.detectChanges();
        }
      });
  }

  toggleExpand(lotId: string | number): void {
    this.expandedLotId = this.expandedLotId === lotId ? null : lotId;
    this.cdr.detectChanges();
  }

  toggleOpen(lot: ParkingLot): void {
    this.lotService.toggleOpen(lot.lotId).subscribe({
      next: () => lot.open = !lot.open,
      error: () => alert('Failed to toggle.')
    });
  }

  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    return [];
  }
}
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ParkingSpotService } from '../../../core/services/parking-spot.service';
import { ParkingLot, ParkingSpot } from '../../../core/models/types';
import { catchError, forkJoin, of, finalize } from 'rxjs';

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lot-detail.component.html',
  styleUrls: ['./lot-detail.component.css']
})
export class LotDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private lotService = inject(ParkingLotService);
  private spotService = inject(ParkingSpotService);

  lot: ParkingLot | null = null;
  availableSpots: ParkingSpot[] = [];
  spotsLoading = true;
  pageLoading = true;
  error = '';
  private cdr = inject(ChangeDetectorRef);

  private sampleImages = [
    'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1545174834-3199e46a51cc?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&q=80&w=1200'
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.pageLoading = false;
      this.error = 'Invalid Lot ID';
      return;
    }

    console.log('[LotDetail] Fetching details for Lot:', id);

    this.pageLoading = true;
    this.spotsLoading = true;
    this.error = '';

    forkJoin({
      lot: this.lotService.getById(id).pipe(catchError(err => {
        console.error('[LotDetail] Lot fetch error:', err);
        return of(null);
      })),
      spots: this.spotService.getAvailable(id).pipe(catchError(err => {
        console.error('[LotDetail] Spots fetch error:', err);
        return of([]);
      }))
    }).pipe(
      finalize(() => {
        this.pageLoading = false;
        this.spotsLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(({ lot, spots }) => {
      this.lot = lot;
      this.availableSpots = spots;
      
      if (!lot) {
        this.error = 'Could not find parking lot details.';
      }
      
      console.log('[LotDetail] Data loaded success:', !!lot);
      this.cdr.detectChanges();
    });
  }

  getLotImage(lot: ParkingLot): string {
    if (lot.imageUrl && lot.imageUrl.startsWith('http')) {
      return lot.imageUrl;
    }
    const index = (lot.lotId.toString().length + lot.name.length) % this.sampleImages.length;
    return this.sampleImages[index];
  }

  handleImageError(event: any): void {
    event.target.src = this.sampleImages[0];
  }

  spotTypeClass(type: string): string {
    const map: Record<string, string> = { 
      'EV': 'badge-ev', 
      'HANDICAPPED': 'badge-handicapped',
      'CAR': 'badge-standard',
      'BIKE': 'badge-standard',
      'TRUCK': 'badge-standard',
      'TWO_WHEELER': 'badge-standard',
      'FOUR_WHEELER': 'badge-standard',
      'THREE_WHEELER': 'badge-standard',
      'HEAVY': 'badge-standard'
    };
    return map[type] || 'badge-standard';
  }
}

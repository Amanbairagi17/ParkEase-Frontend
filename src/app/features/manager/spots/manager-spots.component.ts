import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParkingSpotService } from '../../../core/services/parking-spot.service';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ParkingLot, ParkingSpot } from '../../../core/models/types';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-manager-spots',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './manager-spots.component.html',
  styleUrls: ['./manager-spots.component.css']
})
export class ManagerSpotsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private spotService = inject(ParkingSpotService);
  private lotService = inject(ParkingLotService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  lotId = '';
  lot: ParkingLot | null = null;
  spots: ParkingSpot[] = [];
  loading = true;
  showForm = false;
  submitting = false;
  formError = '';
  activeFilter = 'ALL';
  filters = ['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];

  form = this.fb.group({
    spotNumber: ['', Validators.required],
    floor: [0, [Validators.required, Validators.min(-10), Validators.max(50)]],
    spotType: ['CAR', Validators.required],
    vehicleType: ['FOUR_WHEELER', Validators.required],
    pricePerHour: [50, [Validators.required, Validators.min(0)]],
  });

  get filteredSpots(): ParkingSpot[] {
    return this.activeFilter === 'ALL' ? this.spots : this.spots.filter(s => s.status === this.activeFilter);
  }

  ngOnInit(): void {
    this.lotId = this.route.snapshot.paramMap.get('id')!;
    console.log('[ManagerSpots] Initializing for Lot:', this.lotId);

    this.loading = true;
    forkJoin({
      lot: this.lotService.getById(this.lotId).pipe(catchError(e => { console.error('Lot Error:', e); return of(null); })),
      spots: this.spotService.getByLot(this.lotId).pipe(catchError(e => { console.error('Spots Error:', e); return of([]); })),
    }).subscribe({
      next: ({ lot, spots }) => {
        console.log('[ManagerSpots] Data received:', { lot: !!lot, spotsCount: spots.length });
        this.lot = lot;
        this.spots = spots;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ManagerSpots] Critical Error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.formError = '';
    const v = this.form.value;

    // 1. Enum Mapping Layer
    let spotType = v.spotType as string;
    if (spotType === 'COMPACT' || spotType === 'STANDARD') {
      spotType = 'CAR';
    }

    // 2. Data Type Conversion & Payload Construction
    const payload = {
      lotId: Number(this.lotId), // Ensure lotId is a number
      spotNumber: v.spotNumber!,
      floor: Number(v.floor), // Ensure floor is a number
      spotType: spotType as ParkingSpot['spotType'],
      vehicleType: v.vehicleType as ParkingSpot['vehicleType'],
      pricePerHour: Number(v.pricePerHour),
      handicapped: spotType === 'HANDICAPPED',
      EVCharging: spotType === 'EV',
    };

    // 3. Validation Logging
    console.log('[ManagerSpots] Submitting payload:', payload);

    this.spotService.addSpot(payload).subscribe({
      next: (s) => {
        this.spots.push(s);
        this.form.reset({ floor: 0, spotType: 'CAR', vehicleType: 'FOUR_WHEELER', pricePerHour: 50 });
        this.showForm = false;
        this.submitting = false;
      },
      error: (e) => {
        console.error('[ManagerSpots] Error adding spot:', e);
        this.formError = e?.error?.message || 'Failed to add parking spot. Please check your data types.';
        this.submitting = false;
      }
    });
  }

  deleteSpot(id: string): void {
    if (!confirm('Delete this spot?')) return;
    this.spotService.delete(id).subscribe({
      next: () => this.spots = this.spots.filter(s => s.spotId !== id),
      error: () => alert('Failed to delete spot.')
    });
  }
}

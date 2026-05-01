import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ParkingSpotService } from '../../../core/services/parking-spot.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { ParkingLot, ParkingSpot, Vehicle } from '../../../core/models/types';
import { catchError, of, forkJoin, finalize, BehaviorSubject } from 'rxjs';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-new-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SkeletonLoaderComponent],
  templateUrl: './new-booking.component.html',
  styleUrls: ['./new-booking.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewBookingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lotService = inject(ParkingLotService);
  private spotService = inject(ParkingSpotService);
  private vehicleService = inject(VehicleService);
  private bookingService = inject(BookingService);
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  // State using Signals for better performance
  lots = signal<ParkingLot[]>([]);
  vehicles = signal<Vehicle[]>([]);
  availableSpots = signal<ParkingSpot[]>([]);
  selectedSpot = signal<ParkingSpot | null>(null);
  selectedLot = signal<ParkingLot | null>(null);
  
  loading = signal<boolean>(true);
  spotsLoading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  success = signal<boolean>(false);
  error = signal<string>('');

  form = this.fb.group({
    lotId: ['', Validators.required],
    spotId: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    vehiclePlate: ['', Validators.required],
    bookingType: ['PRE_BOOKING', Validators.required],
  });

  get estimatedTotal(): number {
    const s = this.selectedSpot();
    const v = this.form.value;
    if (!s || !v.startTime || !v.endTime) return 0;
    
    const start = new Date(v.startTime);
    const end = new Date(v.endTime);
    const ms = end.getTime() - start.getTime();
    if (ms <= 0) return 0;
    
    const hrs = Math.max(1, Math.ceil(ms / 3600000));
    return hrs * s.pricePerHour;
  }

  ngOnInit(): void {
    const userId = this.auth.getUserIdFromToken();
    const prefLotId = this.route.snapshot.queryParamMap.get('lotId');

    forkJoin({
      lots: this.lotService.search('').pipe(catchError(() => of([]))),
      vehicles: userId ? this.vehicleService.getByOwner(userId.toString()).pipe(catchError(() => of([]))) : of([]),
    }).subscribe(({ lots, vehicles }) => {
      this.lots.set(lots);
      this.vehicles.set(vehicles);
      this.loading.set(false);

      if (prefLotId) {
        this.form.patchValue({ lotId: prefLotId });
        this.onLotChange();
      }
    });
  }

  onLotChange(): void {
    const lotId = this.form.value.lotId;
    if (!lotId) {
      this.selectedLot.set(null);
      this.availableSpots.set([]);
      return;
    }

    const lot = this.lots().find(l => l.lotId.toString() === lotId.toString()) || null;
    this.selectedLot.set(lot);
    this.spotsLoading.set(true);
    this.availableSpots.set([]);
    this.selectedSpot.set(null);
    this.form.patchValue({ spotId: '' });

    this.spotService.getAvailable(lotId)
      .pipe(finalize(() => this.spotsLoading.set(false)))
      .subscribe({
        next: s => this.availableSpots.set(s),
        error: () => this.error.set('Failed to load available spots.')
      });
  }

  selectSpot(s: ParkingSpot): void {
    this.selectedSpot.set(s);
    this.form.patchValue({ spotId: s.spotId });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.error.set('Please log in first.');
      return;
    }

    const v = this.form.value;
    const vehicle = this.vehicles().find(x => x.licensePlate === v.vehiclePlate);
    
    this.submitting.set(true);
    this.error.set('');

    const bookingData = {
      userId: userId.toString(),
      lotId: v.lotId!,
      spotId: v.spotId!,
      vehiclePlate: v.vehiclePlate!,
      vehicleType: (vehicle?.vehicleType || 'FOUR_WHEELER') as any,
      bookingType: v.bookingType as any,
      startTime: new Date(v.startTime!).toISOString(),
      endTime: new Date(v.endTime!).toISOString(),
      totalAmount: this.estimatedTotal,
    };

    this.bookingService.create(bookingData)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (b) => {
          this.success.set(true);
          this.toast.success('Booking confirmed successfully!');
          this.notificationService.refresh();
          // Redirect after a short delay
          setTimeout(() => this.router.navigate(['/driver/bookings', b.bookingId]), 2000);
        },
        error: (e) => {
          const msg = e?.error?.message || 'Failed to create booking.';
          this.error.set(msg);
          this.toast.error(msg);
        }
      });
  }
}

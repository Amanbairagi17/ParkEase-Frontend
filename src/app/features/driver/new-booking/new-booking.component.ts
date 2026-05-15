import { Component, inject, OnInit, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ParkingSpotService } from '../../../core/services/parking-spot.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { Booking, BookingEstimate, ParkingLot, ParkingSpot, Vehicle } from '../../../core/models/types';
import { catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, of, switchMap } from 'rxjs';
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
  private cdr = inject(ChangeDetectorRef);

  // State using Signals for better performance
  lots = signal<ParkingLot[]>([]);
  searchLoading = signal<boolean>(false);
  searchControl = new FormControl('', { nonNullable: true });
  parkingLots: ParkingLot[] = [];
  showDropdown = false;
  selectedParkingId: string | number | null = null;
  selectedVehicle: Vehicle | null = null;
  startTime: string | null = null;
  endTime: string | null = null;
  vehicles = signal<Vehicle[]>([]);
  vehicleQuery = signal<string>('');
  filteredVehicles = signal<Vehicle[]>([]);
  vehicleOpen = signal<boolean>(false);
  availableSpots = signal<ParkingSpot[]>([]);
  activeBookings = signal<Booking[]>([]);
  selectedSpot = signal<ParkingSpot | null>(null);
  selectedLot = signal<ParkingLot | null>(null);
  estimate = signal<BookingEstimate | null>(null);
  estimateLoading = signal<boolean>(false);
  
  loading = signal<boolean>(true);
  spotsLoading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  success = signal<boolean>(false);
  error = signal<string>('');
  openSearch(): void {
    this.showDropdown = true;
  }

  handleSearchBlur(): void {
    setTimeout(() => this.showDropdown = false, 150);
  }

  selectLot(lot: ParkingLot): void {
    this.form.patchValue({ lotId: lot.lotId });
    this.searchControl.setValue(lot.name, { emitEvent: false });
    this.selectedParkingId = lot.lotId;
    this.selectedLot.set(lot);
    this.showDropdown = false;
    this.onLotChange();
    this.tryLoadSpots();
  }

  selectParking(lot: ParkingLot): void {
    this.selectLot(lot);
  }

  clearLot(): void {
    this.selectedLot.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedParkingId = null;
    this.selectedVehicle = null;
    this.startTime = null;
    this.endTime = null;
    this.form.patchValue({ lotId: '', spotId: '' });
    this.availableSpots.set([]);
    this.selectedSpot.set(null);
  }

  updateVehicleSearch(query: string): void {
    this.vehicleQuery.set(query);
    const q = query.trim().toLowerCase();
    const list = this.vehicles();
    if (!q) {
      this.filteredVehicles.set(list);
      return;
    }
    this.filteredVehicles.set(
      list.filter(v =>
        v.licensePlate.toLowerCase().includes(q) ||
        v.vehicleType.toLowerCase().includes(q)
      )
    );
  }

  openVehicleDropdown(): void {
    this.vehicleOpen.set(true);
  }

  handleVehicleBlur(): void {
    setTimeout(() => this.vehicleOpen.set(false), 150);
  }

  selectVehicle(v: Vehicle): void {
    this.form.patchValue({ vehiclePlate: v.licensePlate });
    this.vehicleQuery.set(`${v.licensePlate} - ${v.vehicleType}`);
    this.selectedVehicle = v;
    this.vehicleOpen.set(false);
    this.tryLoadSpots();
  }

  form = this.fb.group({
    lotId: ['', Validators.required],
    spotId: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    vehiclePlate: ['', Validators.required],
    bookingType: ['PRE_BOOKING', Validators.required],
    pricingType: ['HOURLY', Validators.required],
  }, { validators: [this.dateRangeValidator.bind(this), this.startTimeRequiredValidator.bind(this)] });

  get rawForm() {
    return this.form.getRawValue();
  }

  startTimeRequiredValidator(group: any) {
    const raw = group.getRawValue();
    const type = raw.bookingType;
    const start = raw.startTime;
    if (type === 'PRE_BOOKING' && !start) {
      return { startTimeRequired: true };
    }
    return null;
  }

  dateRangeValidator(group: any) {
    const raw = group.getRawValue();
    const start = raw.startTime;
    const end = raw.endTime;
    if (start && end && new Date(start) >= new Date(end)) {
      return { invalidRange: true };
    }
    return null;
  }

  get minDate(): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  get estimatedTotal(): number {
    return this.estimate()?.totalAmount ?? 0;
  }

  get canConfirm(): boolean {
    return this.form.valid && !!this.selectedSpot() && this.estimatedTotal > 0 && !this.submitting();
  }

  get durationText(): string {
    const v = this.form.value;
    if (!v.startTime || !v.endTime) return '';
    if (this.form.errors?.['invalidRange']) return 'End time must be after start time';
    
    const start = new Date(v.startTime);
    const end = new Date(v.endTime);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 'Invalid duration';

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }

  get showDailySuggestion(): boolean {
    const v = this.form.value;
    if (v.pricingType === 'HOURLY' && this.durationText.includes('d')) return true;
    return false;
  }

  ngOnInit(): void {
    const userId = this.auth.getUserIdFromToken();
    const prefLotId = this.route.snapshot.queryParamMap.get('lotId');

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const query = (value ?? '').trim();
        if (!query) {
          this.searchLoading.set(false);
          this.parkingLots = this.lots();
          return of(null);
        }

        this.searchLoading.set(true);
        return this.lotService.search(query).pipe(
          catchError(() => {
            this.error.set('Failed to load parking lots.');
            return of([]);
          }),
          finalize(() => this.searchLoading.set(false))
        );
      })
    ).subscribe(lots => {
      if (lots === null) return;
      this.parkingLots = Array.isArray(lots) ? lots : [];
      this.showDropdown = true;
    });

    forkJoin({
      lots: this.lotService.search('').pipe(catchError(() => of([]))),
      vehicles: userId ? this.vehicleService.getByOwner(userId.toString()).pipe(catchError(() => of([]))) : of([]),
    }).subscribe(({ lots, vehicles }) => {
      const safeLots = Array.isArray(lots) ? lots : [];
      this.lots.set(safeLots);
      this.parkingLots = safeLots;
      this.vehicles.set(Array.isArray(vehicles) ? vehicles : []);
      this.filteredVehicles.set(Array.isArray(vehicles) ? vehicles : []);
      this.loading.set(false);

      if (prefLotId) {
        const lot = safeLots.find(l => l.lotId.toString() === prefLotId.toString());
        if (lot) {
          this.selectLot(lot);
        }
      }
    });

    this.form.get('startTime')?.valueChanges.subscribe(value => {
      this.startTime = value || null;
      this.tryLoadSpots();
    });
    this.form.get('endTime')?.valueChanges.subscribe(value => {
      this.endTime = value || null;
      this.tryLoadSpots();
    });
    this.form.get('vehiclePlate')?.valueChanges.subscribe(() => this.tryLoadSpots());

    this.form.get('bookingType')?.valueChanges.subscribe(type => {
      console.log('[NewBooking] Booking type changed to:', type);
      const startTimeCtrl = this.form.get('startTime');
      
      if (type === 'WALK_IN_BOOKING') {
        const now = this.minDate;
        startTimeCtrl?.setValue(now, { emitEvent: false });
        startTimeCtrl?.disable({ emitEvent: false });
        console.log('[NewBooking] WALK_IN mode: startTime auto-set to', now);
      } else {
        startTimeCtrl?.enable({ emitEvent: false });
      }
      
      this.form.updateValueAndValidity();
      this.tryLoadSpots();
      this.tryEstimate();
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
    this.availableSpots.set([]);
    this.selectedSpot.set(null);
    this.form.patchValue({ spotId: '' });
  }

  tryLoadSpots(): void {
    const rawForm = this.form.getRawValue();
    const lotId = this.selectedParkingId || rawForm.lotId;
    const startTime = rawForm.startTime;
    const endTime = rawForm.endTime;
    const vehiclePlate = rawForm.vehiclePlate;

    console.log('[NewBooking] tryLoadSpots check:', { lotId, startTime, endTime, vehiclePlate });

    if (!lotId || !vehiclePlate || !startTime || !endTime) {
      console.log('[NewBooking] tryLoadSpots skipped — missing required fields');
      return;
    }

    if (this.form.errors?.['invalidRange']) {
      console.log('[NewBooking] tryLoadSpots skipped — invalid date range');
      return;
    }

    this.loadAvailableSpots(lotId);
  }

  loadAvailableSpots(lotId: string | number): void {
    console.log('[NewBooking] Loading spots for lotId:', lotId);
    this.spotsLoading.set(true);
    this.availableSpots.set([]);

    forkJoin({
      spots: this.spotService.getByLot(lotId),
      bookings: this.bookingService.getActiveByLot(lotId).pipe(catchError(() => of([])))
    })
      .pipe(finalize(() => {
        this.spotsLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: ({ spots, bookings }) => {
          console.log(`[NewBooking] Loaded ${spots.length} spots and ${bookings.length} active/reserved bookings`);
          this.availableSpots.set(Array.isArray(spots) ? spots : []);
          this.activeBookings.set(Array.isArray(bookings) ? bookings : []);
        },
        error: (err) => {
          console.error('[NewBooking] Spot loading error:', err);
          this.error.set('Failed to load available spots.');
        }
      });
  }

  getSpotStatus(spot: ParkingSpot): 'AVAILABLE' | 'AVAILABLE_SOON' | 'BLOCKED' | 'UNKNOWN' {
    // 1. Basic spot status check
    if (spot.status === 'OCCUPIED') return 'BLOCKED';

    // 2. Window-based availability check
    const rawForm = this.form.getRawValue();
    const startTime = rawForm.startTime;
    const endTime = rawForm.endTime;

    if (!startTime || !endTime) {
      return spot.status === 'AVAILABLE' ? 'AVAILABLE' : 'BLOCKED';
    }

    const selectedStart = new Date(startTime).getTime();
    const selectedEnd = new Date(endTime).getTime();

    if (isNaN(selectedStart) || isNaN(selectedEnd) || selectedStart >= selectedEnd) {
      return 'UNKNOWN';
    }

    // 3. Check for overlaps in active/reserved bookings
    const spotBookings = this.activeBookings().filter(b => b.spotId?.toString() === spot.spotId.toString());

    if (spotBookings.length === 0) {
      return spot.status === 'AVAILABLE' ? 'AVAILABLE' : 'AVAILABLE_SOON';
    }

    const hasOverlap = spotBookings.some(b => {
      const bStart = new Date(b.startTime).getTime();
      const bEnd = b.endTime ? new Date(b.endTime).getTime() : null;
      if (!bEnd) return true; // Active booking with no end time blocks everything
      return bStart < selectedEnd && bEnd > selectedStart;
    });

    if (hasOverlap) return 'BLOCKED';

    // If no overlap but spot is currently RESERVED/OCCUPIED, it's AVAILABLE_SOON for the user's future window
    return 'AVAILABLE';
  }

  selectSpot(s: ParkingSpot): void {
    this.selectedSpot.set(s);
    this.form.patchValue({ spotId: s.spotId });
    this.tryEstimate();
  }

  private normalizeLocalDateTime(value: string): string {
    if (!value) return value;
    return value.length === 16 ? `${value}:00` : value;
  }

  private tryEstimate(): void {
    if (this.form.errors?.['invalidRange']) {
      this.estimate.set(null);
      return;
    }

    const rawForm = this.form.getRawValue();
    const { lotId, spotId, startTime, endTime } = rawForm;
    if (!lotId || !spotId || !startTime || !endTime) {
      this.estimate.set(null);
      return;
    }

    this.estimateLoading.set(true);
    console.log('[NewBooking] Requesting estimate for:', { lotId, spotId, startTime, endTime, type: rawForm.bookingType });
    this.bookingService.estimate({
      lotId,
      spotId,
      startTime: this.normalizeLocalDateTime(startTime),
      endTime: this.normalizeLocalDateTime(endTime),
      bookingType: (rawForm.bookingType as any) || 'PRE_BOOKING'
    }).pipe(finalize(() => {
        this.estimateLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (estimate) => this.estimate.set(estimate),
        error: () => this.estimate.set(null)
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.estimatedTotal <= 0) {
      this.error.set('Invalid booking amount. Please check your duration.');
      return;
    }

    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.error.set('Please log in first.');
      return;
    }

    const v = this.form.getRawValue();
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
      pricingType: v.pricingType as any,
      startTime: v.bookingType === 'WALK_IN_BOOKING' ? undefined : this.normalizeLocalDateTime(v.startTime!),
      endTime: this.normalizeLocalDateTime(v.endTime!),
    };
    
    console.log('[NewBooking] Submitting booking:', bookingData);

    this.bookingService.create(bookingData)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (b) => {
          this.success.set(true);
          this.toast.success('Booking confirmed successfully!');
          this.notificationService.refresh();
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

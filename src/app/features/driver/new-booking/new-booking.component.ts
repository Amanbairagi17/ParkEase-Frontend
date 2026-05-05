import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
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
import { Booking, ParkingLot, ParkingSpot, Vehicle } from '../../../core/models/types';
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
  }, { validators: this.dateRangeValidator });

  dateRangeValidator(group: any) {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    if (start && end && new Date(start) >= new Date(end)) {
      return { invalidRange: true };
    }
    return null;
  }

  get minDate(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  }

  get estimatedTotal(): number {
    const s = this.selectedSpot();
    const v = this.form.value;
    if (!s || !v.startTime || !v.endTime || this.form.errors?.['invalidRange']) return 0;
    
    const start = new Date(v.startTime);
    const end = new Date(v.endTime);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs <= 0) return 0;
    
    if (v.pricingType === 'DAILY') {
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return days * (s.pricePerHour * 10); 
    } else {
      const hours = diffMs / (1000 * 60 * 60);
      return Number((hours * s.pricePerHour).toFixed(2));
    }
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
    const lotId = this.selectedParkingId || this.form.value.lotId;
    const startTime = this.startTime || this.form.value.startTime;
    const endTime = this.endTime || this.form.value.endTime;
    const vehiclePlate = this.form.value.vehiclePlate;

    console.log('Selected lotId:', lotId);
    console.log('lotId:', lotId);
    console.log('vehicle:', this.selectedVehicle || vehiclePlate);
    console.log('time:', startTime, endTime);

    if (!lotId || !vehiclePlate || !startTime || !endTime) {
      return;
    }

    if (this.form.errors?.['invalidRange']) {
      return;
    }

    this.loadAvailableSpots(lotId);
  }

  loadAvailableSpots(lotId: string | number): void {
    this.spotsLoading.set(true);
    this.availableSpots.set([]);

    forkJoin({
      spots: this.spotService.getByLot(lotId),
      bookings: this.bookingService.getActiveByLot(lotId).pipe(catchError(() => of([])))
    })
      .pipe(finalize(() => this.spotsLoading.set(false)))
      .subscribe({
        next: ({ spots, bookings }) => {
          console.log('API Response:', spots);
          this.availableSpots.set(Array.isArray(spots) ? spots : []);
          this.activeBookings.set(Array.isArray(bookings) ? bookings : []);
        },
        error: () => this.error.set('Failed to load available spots.')
      });
  }

  getSpotStatus(spot: ParkingSpot): 'AVAILABLE' | 'AVAILABLE_SOON' | 'BLOCKED' | 'UNKNOWN' {
    if (spot.status === 'AVAILABLE') return 'AVAILABLE';
    if (spot.status === 'OCCUPIED') return 'BLOCKED';

    const startTime = this.startTime || this.form.value.startTime;
    const endTime = this.endTime || this.form.value.endTime;
    if (!startTime || !endTime) {
      return spot.status === 'RESERVED' ? 'BLOCKED' : 'UNKNOWN';
    }

    const selectedStart = new Date(startTime).getTime();
    const selectedEnd = new Date(endTime).getTime();
    const bookings = this.activeBookings().filter(b => b.spotId?.toString() === spot.spotId.toString());

    if (bookings.length === 0) {
      return spot.status === 'RESERVED' ? 'AVAILABLE_SOON' : 'UNKNOWN';
    }

    const hasOverlap = bookings.some(b => {
      const bookingStart = new Date(b.startTime).getTime();
      const bookingEnd = b.endTime ? new Date(b.endTime).getTime() : null;
      if (bookingEnd === null) return true;
      return bookingStart < selectedEnd && bookingEnd > selectedStart;
    });

    if (hasOverlap) return 'BLOCKED';

    const soonAvailable = bookings.every(b => {
      if (!b.endTime) return false;
      const bookingEnd = new Date(b.endTime).getTime();
      return bookingEnd < selectedStart;
    });

    return soonAvailable ? 'AVAILABLE_SOON' : 'BLOCKED';
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

    if (this.estimatedTotal <= 0) {
      this.error.set('Invalid booking amount. Please check your duration.');
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
      pricingType: v.pricingType as any,
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

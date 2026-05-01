import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { Vehicle } from '../../../core/models/types';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-driver-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './driver-vehicles.component.html',
  styleUrls: ['./driver-vehicles.component.css']
})
export class DriverVehiclesComponent implements OnInit {

  private vehicleService = inject(VehicleService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  vehicles: Vehicle[] = [];
  loading = true;
  showForm = false;
  submitting = false;
  error = '';

  form = this.fb.nonNullable.group({
    licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z0-9\s-]{5,15}$/i)]],
    make: ['', Validators.required],
    model: ['', Validators.required],
    color: ['', Validators.required],
    vehicleType: ['FOUR_WHEELER' as Vehicle['vehicleType'], Validators.required],
    isEV: [false],
  });

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    const userId = this.auth.getUserIdFromToken();

    if (!userId) {
      this.loading = false;
      return;
    }

    this.loading = true;

    this.vehicleService.getByOwner(userId.toString())
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: any) => {
          this.vehicles = this.extractArray(res);
        },
        error: () => {
          this.error = 'Failed to load vehicles.';
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.error = 'Session expired. Please log in again.';
      return;
    }

    this.submitting = true;
    this.error = '';

    const vehicleData: Partial<Vehicle> = {
      ...this.form.value,
      ownerId: userId.toString()
    };

    this.vehicleService.register(vehicleData as Vehicle)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (res: any) => {
          const newVehicle = this.extractObject(res);
          if (newVehicle) this.vehicles.unshift(newVehicle);

          this.form.reset({ vehicleType: 'FOUR_WHEELER', isEV: false });
          this.showForm = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to register vehicle.';
        }
      });
  }

  deleteVehicle(id: string): void {
    if (!confirm('Remove this vehicle?')) return;

    this.vehicleService.delete(id).subscribe({
      next: () => {
        this.vehicles = this.vehicles.filter(v => v.vehicleId !== id);
      },
      error: () => {
        alert('Failed to remove vehicle.');
      }
    });
  }

  getVehicleIcon(type: string): string {
    switch (type) {
      case 'TWO_WHEELER':
      case 'BIKE':
      case 'MOTORCYCLE':
        return 'moped';
      case 'FOUR_WHEELER':
      case 'CAR':
        return 'directions_car';
      case 'HEAVY':
      case 'TRUCK':
      case 'BUS':
        return 'local_shipping';
      default:
        return 'minor_crash';
    }
  }

  formatVehicleType(type: string): string {
    return type ? type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
  }

  private extractArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    return [];
  }

  private extractObject(res: any): any {
    if (!res) return null;
    if (res?.data) return res.data;
    return res;
  }
}
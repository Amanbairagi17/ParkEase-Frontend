import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-lot-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './lot-form.component.html',
  styleUrls: ['./lot-form.component.css']
})
export class LotFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private lotService = inject(ParkingLotService);
  private auth = inject(AuthService);

  isEdit = false;
  lotId: string | null = null;
  submitting = false;
  error = '';

  sampleImages = [
    'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1545174834-3199e46a51cc?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&q=80&w=800'
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    latitude: [null as number | null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    totalSpots: [1, [Validators.required, Validators.min(1)]],
    openTime: ['08:00', Validators.required],
    closeTime: ['22:00', Validators.required],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.lotId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.lotId;
    
    if (this.isEdit && this.lotId) {
      console.log('[LotForm] Loading existing lot:', this.lotId);
      this.lotService.getById(this.lotId).subscribe({
        next: (l) => {
          this.form.patchValue(l as any);
          console.log('[LotForm] Lot data loaded');
        },
        error: (err) => {
          console.error('[LotForm] Load error:', err);
          this.error = 'Failed to load parking lot details.';
        }
      });
    }
  }

  selectSampleImage(url: string): void {
    this.form.patchValue({ imageUrl: url });
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

    const v = this.form.value;
    const payload = { 
      ...v, 
      managerId: userId.toString(),
      open: true,
      approved: false
    } as any;

    console.log('[LotForm] Submitting:', payload);

    const request = this.isEdit
      ? this.lotService.update(this.lotId!, payload)
      : this.lotService.create(payload);

    request.pipe(
      finalize(() => this.submitting = false)
    ).subscribe({
      next: (res) => {
        console.log('[LotForm] Success:', res);
        this.router.navigate(['/manager/lots']);
      },
      error: (e) => {
        console.error('[LotForm] Error:', e);
        this.error = e?.error?.message || 'An error occurred while saving the facility.';
      }
    });
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Receipt } from '../../../core/models/types';
import { AuthService } from '../../../core/services/auth.service';
import { ReceiptService } from '../../../core/services/receipt.service';
import { ReceiptCardComponent } from '../receipt-card/receipt-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-receipt-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ReceiptCardComponent, SkeletonLoaderComponent],
  templateUrl: './receipt-history.component.html',
  styleUrls: ['./receipt-history.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptHistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private receiptService = inject(ReceiptService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  receipts = signal<Receipt[]>([]);
  filtered = signal<Receipt[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  page = signal<number>(1);
  pageSize = 6;
  isAdmin = signal<boolean>(false);

  filterForm = this.fb.group({
    search: [''],
    status: [''],
    parking: [''],
    vehicle: [''],
    startDate: [''],
    endDate: [''],
    adminUserId: ['']
  });

  ngOnInit(): void {
    this.isAdmin.set(this.auth.currentUser?.role === 'ADMIN');
    this.loadReceipts();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    if (this.isAdmin()) {
      this.filterForm.get('adminUserId')?.valueChanges.subscribe(() => {
        this.loadReceipts();
      });
    }
  }

  loadReceipts(): void {
    const isAdmin = this.isAdmin();
    const userId = isAdmin && this.filterForm.value.adminUserId
      ? Number(this.filterForm.value.adminUserId)
      : this.auth.getUserIdFromToken();

    if (!userId) {
      this.loading.set(false);
      this.error.set('Please login to view receipt history.');
      return;
    }

    this.loading.set(true);
    this.receiptService.getUserReceipts(userId).subscribe({
      next: receipts => {
        this.receipts.set(receipts || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load receipt history.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    const form = this.filterForm.value;
    const search = (form.search || '').toLowerCase();
    const status = (form.status || '').toLowerCase();
    const parking = (form.parking || '').toLowerCase();
    const vehicle = (form.vehicle || '').toLowerCase();
    const startDate = form.startDate ? new Date(form.startDate) : null;
    const endDate = form.endDate ? new Date(form.endDate) : null;

    const filtered = this.receipts().filter(r => {
      const matchesSearch = !search ||
        r.receiptNumber.toLowerCase().includes(search) ||
        String(r.paymentId).includes(search) ||
        String(r.bookingId).includes(search);

      const matchesStatus = !status || (r.paymentStatus || '').toLowerCase() === status;
      const matchesParking = !parking || r.parkingName.toLowerCase().includes(parking);
      const matchesVehicle = !vehicle || r.vehicleNumber.toLowerCase().includes(vehicle);

      const generated = r.generatedAt ? new Date(r.generatedAt) : null;
      const matchesStart = !startDate || (generated && generated >= startDate);
      const matchesEnd = !endDate || (generated && generated <= endDate);

      return matchesSearch && matchesStatus && matchesParking && matchesVehicle && matchesStart && matchesEnd;
    });

    this.filtered.set(filtered);
    this.page.set(1);
  }

  get pagedReceipts(): Receipt[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered().length / this.pageSize));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.page.set(this.page() + 1);
    }
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
  }

  retry(): void {
    this.toast.info('Refreshing receipts...');
    this.loadReceipts();
  }
}

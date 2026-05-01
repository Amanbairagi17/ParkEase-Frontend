import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ParkingLot } from '../../../core/models/types';
import { debounceTime, distinctUntilChanged, finalize, tap } from 'rxjs';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-search-lots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SkeletonLoaderComponent],
  templateUrl: './search-lots.component.html',
  styleUrls: ['./search-lots.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchLotsComponent implements OnInit {
  private lotService = inject(ParkingLotService);

  lots = signal<ParkingLot[]>([]);
  loading = signal<boolean>(true);
  
  searchCtrl = new FormControl('');
  cityCtrl = new FormControl('');

  ngOnInit(): void {
    this.loadLots();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadLots());

    this.cityCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadLots());
  }

  loadLots(): void {
    this.loading.set(true);
    const query = this.searchCtrl.value || '';
    // For now searching all, backend might need city filter update
    this.lotService.search(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => this.lots.set(res));
  }

  resetSearch(): void {
    this.searchCtrl.setValue('');
    this.cityCtrl.setValue('');
    this.loadLots();
  }

  getLotImage(lot: ParkingLot): string {
    return lot.imageUrl || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800';
  }

  handleImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800';
  }
}
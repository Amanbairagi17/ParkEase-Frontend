import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Receipt } from '../../../core/models/types';
import { ReceiptDownloadComponent } from '../receipt-download/receipt-download.component';

@Component({
  selector: 'app-receipt-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ReceiptDownloadComponent],
  templateUrl: './receipt-card.component.html',
  styleUrls: ['./receipt-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptCardComponent {
  @Input({ required: true }) receipt!: Receipt;
}

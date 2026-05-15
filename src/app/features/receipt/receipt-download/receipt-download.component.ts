import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptPdfService } from '../../../core/services/receipt-pdf.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-receipt-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-download.component.html',
  styleUrls: ['./receipt-download.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptDownloadComponent {
  @Input({ required: true }) receiptId!: string;
  @Input() receiptNumber = 'receipt';
  @Input() contentId = 'receipt-content';

  private pdfService = inject(ReceiptPdfService);
  private toast = inject(ToastService);

  async download() {
    try {
      await this.pdfService.generatePdf(this.contentId, this.receiptNumber);
      this.toast.success('Receipt downloaded successfully.');
    } catch (error) {
      this.toast.error('Failed to generate PDF.');
    }
  }

  async openInNewTab() {
    // For local generation, we can just print or preview. 
    // In this context, we'll use print as a way to "open" or preview.
    await this.print();
  }

  async print() {
    try {
      await this.pdfService.printElement(this.contentId);
    } catch (error) {
      this.toast.error('Failed to prepare print.');
    }
  }

  share() {
    if (!navigator.share) {
      this.toast.info('Sharing is not supported on this device.');
      return;
    }
    const shareUrl = `${window.location.origin}/receipts/details/${this.receiptId}`;
    navigator.share({
      title: 'ParkEase Receipt',
      text: `View your parking receipt: ${this.receiptNumber}`,
      url: shareUrl
    }).catch(() => this.toast.error('Unable to share receipt.'));
  }
}

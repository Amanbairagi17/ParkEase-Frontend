import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const receiptRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./receipt-list/receipt-list.component').then(m => m.ReceiptListComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./receipt-history/receipt-history.component').then(m => m.ReceiptHistoryComponent)
      },
      {
        path: 'payment-success',
        loadComponent: () => import('./payment-success/payment-success.component').then(m => m.PaymentSuccessComponent)
      },
      {
        path: ':receiptId',
        loadComponent: () => import('./receipt-details/receipt-details.component').then(m => m.ReceiptDetailsComponent)
      }
    ]
  }
];

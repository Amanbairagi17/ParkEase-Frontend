import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, retry, switchMap, throwError, timer } from 'rxjs';
import { Receipt } from '../models/types';
import { guardUserId } from '../utils/user-id';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly API = this.api.url('/receipts');

  getReceiptById(receiptId: string): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.API}/${receiptId}`).pipe(
      retry({ count: 1, delay: 500 }),
      catchError(err => throwError(() => err))
    );
  }

  getUserReceipts(userId: string | number): Observable<Receipt[]> {
    const safeUserId = guardUserId(userId, 'ReceiptService.getUserReceipts');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }
    return this.http.get<Receipt[]>(`${this.API}/user/${safeUserId}`).pipe(
      retry({ count: 1, delay: 500 }),
      catchError(err => throwError(() => err))
    );
  }

  getReceiptByPaymentId(paymentId: string | number): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.API}/payment/${paymentId}`).pipe(
      retry({ count: 1, delay: 500 }),
      catchError(err => throwError(() => err))
    );
  }

  generateReceipt(paymentId: string | number): Observable<Receipt> {
    return this.http.post<Receipt>(`${this.API}/generate/${paymentId}`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }


  waitForReceiptByPaymentId(userId: number, paymentId: number, timeoutMs = 20000): Observable<Receipt> {
    const safeUserId = guardUserId(userId, 'ReceiptService.waitForReceiptByPaymentId');
    if (safeUserId === null) {
      return throwError(() => new Error('Invalid userId'));
    }

    return timer(0, 2000).pipe(
      switchMap(() => this.getReceiptByPaymentId(paymentId).pipe(
        catchError(() => this.getUserReceipts(safeUserId).pipe(
          map(list => list.find(r => Number(r.paymentId) === Number(paymentId))),
          switchMap(found => found ? of(found) : this.generateReceipt(paymentId)),
          catchError(() => throwError(() => new Error('Receipt not ready')))
        ))
      )),
      retry({ count: Math.floor(timeoutMs / 2000) - 1, delay: 2000 })
    );
  }
}

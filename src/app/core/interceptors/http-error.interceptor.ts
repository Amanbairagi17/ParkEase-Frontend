import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;
      const message = error.error?.message || error.message || 'Unexpected error occurred.';

      if ([0, 500, 502, 503, 504].includes(status)) {
        toast.error(message || 'Service is temporarily unavailable.');
      }

      return throwError(() => error);
    })
  );
};

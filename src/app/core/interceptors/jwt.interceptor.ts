import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.token;

  const addToken = (r: HttpRequest<unknown>, t: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${t}` } });

  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isLoggedIn) {
        return auth.refreshToken().pipe(
          switchMap(res => {
            const newToken = (res as any).accessToken || (res as any).token;
            if (newToken) {
              (auth as any).persist(auth.currentUser, newToken, res.refreshToken);
              return next(addToken(req, newToken));
            }
            auth.logout();
            return throwError(() => error);
          }),
          catchError(() => {
            auth.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.token;

  const addToken = (r: HttpRequest<unknown>, t: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${t}` } });

  const isAuthRequest = req.url.includes('/auth/login') || 
                        req.url.includes('/auth/register') || 
                        req.url.includes('/auth/refresh') ||
                        req.url.includes('/auth/logout');

  const authReq = (token && !isAuthRequest) ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 and not already an auth/refresh request
      if (error.status === 401 && auth.isLoggedIn && !isAuthRequest) {
        return auth.refreshToken().pipe(
          switchMap(res => {
            const newToken = (res as any).accessToken || (res as any).token;
            if (newToken) {
              // Note: persist will update the state and trigger subscribers
              (auth as any).persist(auth.currentUser, newToken, res.refreshToken);
              return next(addToken(req, newToken));
            }
            auth.logout();
            return throwError(() => error);
          }),
          catchError((err) => {
            auth.logout();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return from(auth.refreshToken()).pipe(
          switchMap((ok) => {
            if (!ok) {
              router.navigate(['/login']);
              return throwError(() => err);
            }
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${auth.getAccessToken()}` },
            });
            return next(retryReq);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};

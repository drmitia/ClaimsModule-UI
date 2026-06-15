import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const cloned = req.clone({
    setHeaders: {
      'Authorization': `Bearer mock-token`,
      'X-User': authService.getUserHeader(),
      'X-Correlation-ID': crypto.randomUUID(),
    }
  });

  return next(cloned);
};
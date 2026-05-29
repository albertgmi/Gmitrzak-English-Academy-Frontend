import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let message = 'An unexpected error occurred.';

            if (error.error?.message) {
                message = error.error.message;
            } else if (error.message) {
                message = error.message;
            }

            if (error.status !== 401) {
                messageService.add({
                    severity: 'error',
                    summary: `Error ${error.status}`,
                    detail: message,
                    life: 5000
                });
            }

            return throwError(() => error);
        })
    );
};
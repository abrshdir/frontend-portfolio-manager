import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SettingsService } from './settings.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const settings = inject(SettingsService);
    const apiKey = settings.getApiKey();
    
    return next(req.clone({
        setHeaders: {
            'x-openai-key': apiKey ?? '' // Add null coalescing operator
        }
    }));
};
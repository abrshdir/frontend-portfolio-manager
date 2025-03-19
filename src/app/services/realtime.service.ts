import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RealtimeService {
    private apiUrl = 'http://localhost:3000/realtime';

    constructor(private http: HttpClient) { }

    getSession(): Observable<any> {
        return this.http.get(`${this.apiUrl}/session`).pipe(
            catchError(error => {
                console.error('Error fetching session:', error);
                if (error.status === 500 && error.error?.message?.includes('Failed to generate ephemeral key')) {
                    return throwError(() => new Error('OpenAI API key is missing or invalid. Please check your backend .env file.'));
                }
                return throwError(() => new Error('Failed to connect to the backend service.'));
            })
        );
    }
}
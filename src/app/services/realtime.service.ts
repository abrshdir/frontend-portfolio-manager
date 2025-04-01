import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RealtimeService {
    private apiUrl = 'https://vps.victorytech.org/api/realtime';
    private apiUrl2 = 'https://vps.victorytech.org/api/demo-account';

    // Remove the hardcoded demoAccount
    constructor(private http: HttpClient) { }

    // Update setup method to use backend-generated account
    setupDemoAccount(): Observable<any> {
        return this.http.post(`${this.apiUrl2}/`, {}).pipe( // Empty payload
            tap((response: any) => {
                localStorage.setItem('portfolioUserId', response._id);
            }),
            catchError(error => {
                console.error('Error setting up demo account:', error);
                return throwError(() => new Error('Failed to initialize demo account'));
            })
        );
    }

    // Add method to retrieve stored ID
    getStoredUserId(): string | null {
        return localStorage.getItem('portfolioUserId');
    }

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

    async getAptPriceHistory(timeframe: string) {
        const url = `https://api.coingecko.com/api/v3/coins/aptos/market_chart`; // Fixed coin ID
        const params = {
            vs_currency: 'usd',
            days: timeframe === '5-minutely' ? '1' : '90', // Match backend mapping
            interval: timeframe === 'daily' ? 'daily' : '5m'
        };

        try {
            const response = await lastValueFrom(
                this.http.get(url, { params })
            );
            console.log('API Response:', response);
            return (response as any).prices.map(([timestamp, price]: [number, number]) => ({
                time: new Date(timestamp).toISOString(),
                value: price
            }));
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to fetch price data');
        }
    }

    callFunction(name: string, args: any, callId: string) {
        return this.http.post(`${this.apiUrl}/execute-function`, {
            name,
            args,
            callId
        });
    }

    getDemoAccount(userId: string): Observable<any> {
        return this.http.get(`${this.apiUrl2}/user/${userId}`);  // 👈 Add /user/ path segment
    }

    // Add this new method
    submitFunctionResult(callId: string, name: string, result: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/submit-function-result`, {
            callId,
            name,
            result
        }).pipe(
            catchError(error => {
                console.error('Error submitting function result:', error);
                return throwError(() => new Error('Failed to submit function result'));
            })
        );
    }
}
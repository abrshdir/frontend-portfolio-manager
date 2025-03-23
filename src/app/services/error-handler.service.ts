import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class ErrorHandlerService {
    private errorMap = new Map<number, string>([
        [1001, 'Price data unavailable'],
        [2001, 'Wallet connection failed'],
        [3001, 'Insufficient balance']
    ]);

    handle(error: any): string {
        const code = error?.status || error?.code || 1000;
        return this.errorMap.get(code) || 'Operation failed';
    }
}
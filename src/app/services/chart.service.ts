import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChartService {
    // Add these new subjects for tool calls
    private activeToolCallSource = new Subject<any>();
    private toolCallCompleteSource = new Subject<any>();
    
    // Existing price data observable
    private priceData = new BehaviorSubject<any[]>([]);
    currentPriceData = this.priceData.asObservable();
    
    // New observables for tool handling
    activeToolCall$ = this.activeToolCallSource.asObservable();
    toolCallComplete$ = this.toolCallCompleteSource.asObservable();

    updateChart(data: any[]) {
        this.priceData.next(data);
    }

    // Add methods to handle tool calls
    triggerToolCall(toolData: any) {
        this.activeToolCallSource.next(toolData);
    }

    completeToolCall(result: any) {
        this.toolCallCompleteSource.next(result);
    }
}
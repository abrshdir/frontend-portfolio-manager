import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import { CommonModule } from '@angular/common';
import { TradingViewChartComponent } from '../trading-view-chart/trading-view-chart.component';
import { RealtimeService } from '../../services/realtime.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TradingViewChartComponent], // Import the new component
  template: `
    <div class="space-y-6 p-6 bg-gray-800/30 rounded-xl backdrop-blur-lg border border-gray-700">
      <!-- Wallet Balance -->
      <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl">
        <h2 class="text-xl font-semibold mb-2">Wallet Balance</h2>
        <p class="text-3xl font-bold">\${{ currentPrice.toFixed(2) }}</p>
      </div>

      <!-- Price Chart -->
       <!-- Add to template section -->
      <div *ngIf="showChart" class="bg-gray-800/50 p-6 rounded-xl relative">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">APT Price</h2>
          <button (click)="closeChart()" class="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <app-trading-view-chart 
          (mouseenter)="resetTimer()"
          (chartActivated)="showChart = true; resetTimer()">
        </app-trading-view-chart>
      </div>

      <!-- Transaction History -->
      <div class="bg-gray-800/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold mb-4">Transaction History</h2>
        <div class="space-y-4">
          <div *ngFor="let tx of transactions" class="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
            <div>
              <p class="font-medium">{{tx.type}}</p>
              <p class="text-sm text-gray-400">{{tx.date}}</p>
            </div>
            <p [class]="tx.amount > 0 ? 'text-green-400' : 'text-red-400'">
              {{tx.amount}} APT
            </p>
          </div>
        </div>
      </div>

      <!-- Contacts -->
      <div class="bg-gray-800/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold mb-4">Contacts</h2>
        <div class="space-y-4">
          <div *ngFor="let contact of contacts" class="p-4 bg-gray-700/30 rounded-lg">
            <p class="font-medium">{{contact.name}}</p>
            <p class="text-sm text-gray-400">{{contact.address}}</p>
          </div>
        </div>
      </div>
  `
})
export class DashboardComponent implements AfterViewInit, OnInit {
  // Add {static: false} and safe navigation operator
  @ViewChild(TradingViewChartComponent, { static: false }) chartComponent?: TradingViewChartComponent;
  constructor(private chartService: ChartService) { }
  ngAfterViewInit() {
    // Add null check and setTimeout to ensure component exists
    setTimeout(() => {
      if (this.chartComponent) {
        this.chartComponent.chartActivated.subscribe(() => {
          this.showChart = true;
          this.resetTimer();
        });
      }
    }, 0);

    this.startTimer();
  }

  // Add to component properties
  currentPrice: number = 0;

  // Update ngOnInit
  ngOnInit() {
    this.chartService.toolCallComplete$.subscribe(result => {
      if (result.action === 'update_chart') {
        this.showChart = true;
        this.resetTimer();
      } else if (result.action === 'update_price') {
        this.currentPrice = result.value;
      }
    });
  }


  transactions = [
    { type: 'Received', amount: 1.5, date: '2024-01-20' },
    { type: 'Sent', amount: -0.5, date: '2024-01-19' }
  ];

  contacts = [
    { name: 'Alice', address: '0x1234...5678' },
    { name: 'Bob', address: '0x8765...4321' }
  ];

  showChart = false;
  timerId: any;
  selectedCoin = 'APT'; // Default coin


  startTimer() {
    this.timerId = setTimeout(() => {
      this.showChart = false;
    }, 10 * 60 * 1000); // 10 minutes
  }

  resetTimer() {
    clearTimeout(this.timerId);
    this.startTimer();
  }

  closeChart() {
    clearTimeout(this.timerId);
    this.showChart = false;
  }

  // Add this to make permanent
  keepChartVisible() {
    clearTimeout(this.timerId);
  }
}
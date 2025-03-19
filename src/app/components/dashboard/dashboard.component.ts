import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradingViewChartComponent } from '../trading-view-chart/trading-view-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TradingViewChartComponent], // Import the new component
  template: `
    <div class="space-y-6 p-6 bg-gray-800/30 rounded-xl backdrop-blur-lg border border-gray-700">
      <!-- Wallet Balance -->
      <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl">
        <h2 class="text-xl font-semibold mb-2">Wallet Balance</h2>
        <p class="text-3xl font-bold">0.00 APT</p>
      </div>

      <!-- Price Chart -->
      <div class="bg-gray-800/50 p-6 rounded-xl">
        <h2 class="text-xl font-semibold mb-4">APT Price</h2>
        <app-trading-view-chart></app-trading-view-chart> <!-- Use the new component -->
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
    </div>
  `
})
export class DashboardComponent {
  transactions = [
    { type: 'Received', amount: 1.5, date: '2024-01-20' },
    { type: 'Sent', amount: -0.5, date: '2024-01-19' }
  ];

  contacts = [
    { name: 'Alice', address: '0x1234...5678' },
    { name: 'Bob', address: '0x8765...4321' }
  ];
}

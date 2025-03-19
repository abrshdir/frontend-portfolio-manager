import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Crypto Portfolio
          </h1>
        </div>
        <button
          (click)="useDemoAccount()"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Try Demo Account
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  useDemoAccount() {
    // Implement demo account logic
  }
}
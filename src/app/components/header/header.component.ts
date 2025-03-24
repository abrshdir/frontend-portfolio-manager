import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="bg-gray-800/50 border-b border-gray-700">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Crypto Portfolio
          </h1>
        </div>
        <div class="flex gap-4">
          <button
            (click)="openSettings()"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ⚙️ Settings
          </button>
          <button
            (click)="useDemoAccount()"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Try Demo Account
          </button>
        </div>
      </div>

      <!-- Settings Modal -->
      <!-- // In the template section, modify the settings modal div: -->
      <!-- Move modal outside of header element -->
      <div *ngIf="showSettingsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
          <div class="bg-gray-800 rounded-xl p-6 w-11/12 md:max-w-md mx-auto">
              <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-semibold">API Settings</h2>
                  <button 
                      (click)="showSettingsModal = false"
                      class="text-gray-400 hover:text-white transition-colors"
                  >
                      ✕
                  </button>
              </div>
              
              <div class="space-y-4">
                  <div>
                      <label class="block text-sm font-medium mb-2">OpenAI API Key</label>
                      <input
                          type="password"
                          [(ngModel)]="apiKey"
                          placeholder="sk-...your-key"
                          class="bg-gray-700/30 rounded-lg p-2 w-full text-white"
                      >
                  </div>
                  
                  <div class="flex gap-4 justify-end">
                      <button
                          (click)="saveSettings()"
                          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                          Save
                      </button>
                      <button
                          (click)="clearSettings()"
                          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                          Clear
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  showSettingsModal = false;
  apiKey = '';

  constructor(private settingsService: SettingsService) {
    this.apiKey = this.settingsService.getApiKey() || '';
  }

  openSettings() {
    this.showSettingsModal = true;
  }

  saveSettings() {
    if (this.apiKey) {
      this.settingsService.setApiKey(this.apiKey);
    }
    this.showSettingsModal = false;
  }

  clearSettings() {
    this.settingsService.clearApiKey();
    this.apiKey = '';
  }

  useDemoAccount() {
    // Demo account logic
  }
}
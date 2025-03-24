import { Component } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="showSettings" class="bg-gray-800/50 p-6 rounded-xl mt-6">
      <h2 class="text-xl font-semibold mb-4">API Settings</h2>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <input
            type="password"
            [(ngModel)]="apiKey"
            placeholder="Enter OpenAI API Key"
            class="bg-gray-700/30 rounded-lg p-2 flex-1 text-white"
          >
          <button 
            (click)="saveKey()"
            class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
          >
            Save
          </button>
          <button 
            (click)="clearKey()"
            class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
        <p class="text-sm text-gray-400">
          Your API key is stored locally and only used on the frontend
        </p>
      </div>
    </div>
  `
})
export class SettingsComponent {
  apiKey = '';
  showSettings = false;

  constructor(private settingsService: SettingsService) {
    this.apiKey = this.settingsService.getApiKey() || '';
  }

  saveKey() {
    if (this.apiKey) {
      this.settingsService.setApiKey(this.apiKey);
    }
  }

  clearKey() {
    this.settingsService.clearApiKey();
    this.apiKey = '';
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }
}
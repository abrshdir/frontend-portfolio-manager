import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { FormsModule } from '@angular/forms';
import { RealtimeService } from '../../services/realtime.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="bg-gray-800/50 border-b border-gray-700">
      <div
        class="container mx-auto px-4 py-4 flex justify-between items-center"
      >
        <div class="flex items-center space-x-4">
          <h1
            class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            AI Crypto Portfolio
          </h1>
        </div>
        <div class="flex gap-4">
          <button
            (click)="openSettings()"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            ⚙️ Settings
          </button>
          <button
            (click)="useDemoAccount()"
            [disabled]="isDemoLoading || currentDemoAddress"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span *ngIf="!isDemoLoading && !currentDemoAddress">Try Demo Account</span>
            <span *ngIf="isDemoLoading">Initializing...</span>
            <span *ngIf="currentDemoAddress && !isDemoLoading">
                Using: {{ currentDemoAddress.slice(0, 6) }}...{{ currentDemoAddress.slice(-4) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Settings Modal -->
      <!-- // In the template section, modify the settings modal div: -->
      <!-- Move modal outside of header element -->
      <div
        *ngIf="showSettingsModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]"
      >
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
              <label class="block text-sm font-medium mb-2"
                >OpenAI API Key</label
              >
              <input
                type="password"
                [(ngModel)]="apiKey"
                placeholder="sk-...your-key"
                class="bg-gray-700/30 rounded-lg p-2 w-full text-white"
              />
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
  `,
})
export class HeaderComponent implements OnInit {
  showSettingsModal = false;
  apiKey = '';
  isDemoLoading: boolean = false;
  currentDemoAddress: any = '';

  constructor(
    private settingsService: SettingsService,
    private realtimeService: RealtimeService,
    private toastr: ToastrService
  ) {
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

  async useDemoAccount() {
      this.isDemoLoading = true;
      try {
          const response = await firstValueFrom(this.realtimeService.setupDemoAccount());
          // Only update storage with new ID
          localStorage.setItem('portfolioUserId', response._id);
          sessionStorage.setItem('portfolioUserId', response._id);
          this.currentDemoAddress = response.publicAddress;
          
          this.toastr.success('Demo account activated!', 'Success', {
              positionClass: 'toast-bottom-right'
          });
      } catch (error) {
          // Removed all removal logic
          this.toastr.error('Failed to activate demo account', 'Error', {
              positionClass: 'toast-bottom-right'
          });
      } finally {
          this.isDemoLoading = false;
      }
  }

  async loadDemoAccount(userId: string) {
      try {
          const account = await firstValueFrom(
            this.realtimeService.getDemoAccount(userId).pipe(
              catchError(error => {
                console.error('API Error:', error);
                // Don't remove ID immediately, retry once
                return throwError(() => new Error('Failed to load account'));
              })
            )
          );
          this.currentDemoAddress = account.publicAddress;
      } catch (error) {
          this.toastr.warning('Connection issue - trying again...', 'Warning');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
              const account = await firstValueFrom(this.realtimeService.getDemoAccount(userId));
              this.currentDemoAddress = account.publicAddress;
          } catch {
              // Removed storage cleanup
          }
      }
  }

  ngOnInit() {
    // Check both storage locations
    const storedId = localStorage.getItem('portfolioUserId') || sessionStorage.getItem('portfolioUserId');
    if (storedId) {
      this.loadDemoAccount(storedId);
    }
  }
}

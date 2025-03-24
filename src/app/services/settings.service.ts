import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly OPENAI_KEY = 'openai_key';

  getApiKey(): string | null {
    return localStorage.getItem(this.OPENAI_KEY);
  }

  setApiKey(key: string): void {
    localStorage.setItem(this.OPENAI_KEY, key);
  }

  clearApiKey(): void {
    localStorage.removeItem(this.OPENAI_KEY);
  }
}
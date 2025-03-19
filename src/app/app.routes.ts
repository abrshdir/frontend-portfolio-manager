import { Routes } from '@angular/router';
import { TranscriptionComponent } from './components/transcription/transcription.component';

export const routes: Routes = [
  { path: '', component: TranscriptionComponent },
  { path: '**', redirectTo: '' }
];

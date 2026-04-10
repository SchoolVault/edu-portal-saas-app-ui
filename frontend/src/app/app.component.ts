import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogHostComponent } from './shared/confirm-dialog/confirm-dialog-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogHostComponent],
  template: `<router-outlet></router-outlet><app-confirm-dialog-host />`,
  styles: [`:host { display: block; }`]
})
export class AppComponent {}

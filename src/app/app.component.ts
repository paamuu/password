import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {PasswordComponent} from './pages/password/password.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PasswordComponent],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'password';
}

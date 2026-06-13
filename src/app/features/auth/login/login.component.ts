import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  demoAccounts = [
    { email: 'admin@barbersystem.com',  rol: 'Administrador' },
    { email: 'miguel@barbersystem.com', rol: 'Barbero' },
    { email: 'sofia@barbersystem.com',  rol: 'Cajero' },
    { email: 'lucia@barbersystem.com',  rol: 'Recepción' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  fillDemo(email: string): void {
    this.loginForm.patchValue({ email, password: '123456' });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.snackBar.open('¡Bienvenido al sistema!', '', { duration: 2500 });
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message || 'Error al iniciar sesión';
      },
    });
  }

  get emailCtrl() { return this.loginForm.get('email')!; }
  get passCtrl()  { return this.loginForm.get('password')!; }
}

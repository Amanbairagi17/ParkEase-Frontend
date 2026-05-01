import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-center">
      <div class="card">
        <div class="logo"><span class="logo-icon">P</span><span>ParkEase</span></div>
        <h1>Reset password</h1>
        <p class="subtitle">Enter the OTP from your email and choose a new password.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <div class="field">
            <label>Email</label>
            <input formControlName="email" type="email" placeholder="you@example.com">
          </div>
          <div class="field">
            <label>OTP</label>
            <input formControlName="otp" placeholder="6-digit code">
          </div>
          <div class="field">
            <label>New password</label>
            <input formControlName="newPassword" type="password" placeholder="Min 8 characters">
          </div>
          <div *ngIf="error" class="alert-error">{{ error }}</div>
          <div *ngIf="success" class="alert-success">Password reset! Redirecting…</div>
          <button type="submit" class="btn-primary" [disabled]="submitting">
            {{ submitting ? 'Resetting…' : 'Reset password' }}
          </button>
        </form>
        <p class="switch-auth"><a routerLink="/login">← Back to login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-center { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: var(--bg); }
    .card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; }
    .logo { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; margin-bottom: 1.5rem; }
    .logo-icon { width: 28px; height: 28px; background: var(--primary); color: white; border-radius: 6px; display: grid; place-items: center; font-size: 0.85rem; }
    h1 { font-size: 1.4rem; font-weight: 600; margin: 0 0 0.25rem; }
    .subtitle { color: var(--muted-text); font-size: 0.875rem; margin: 0 0 1.5rem; }
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    label { font-size: 0.875rem; font-weight: 500; }
    input { padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); font-size: 0.9rem; outline: none; }
    input:focus { border-color: var(--primary); }
    .alert-success { padding: 0.6rem 0.75rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534; font-size: 0.875rem; }
    .alert-error { padding: 0.6rem 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: var(--danger); font-size: 0.875rem; }
    .btn-primary { padding: 0.65rem; background: var(--primary); color: white; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; }
    .switch-auth { font-size: 0.875rem; text-align: center; margin-top: 1rem; }
    .switch-auth a { color: var(--primary); text-decoration: none; }
  `]
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });
  submitting = false; success = false; error = '';
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.error = '';
    const { email, otp, newPassword } = this.form.value;
    this.auth.resetPassword({ email: email!, otp: otp!, newPassword: newPassword! }).subscribe({
      next: () => { this.success = true; setTimeout(() => this.router.navigate(['/login']), 1500); },
      error: (e) => { this.error = e?.error?.message || 'Reset failed.'; this.submitting = false; }
    });
  }
}

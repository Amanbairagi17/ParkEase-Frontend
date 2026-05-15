import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  step = signal<1 | 2>(1);
  submitting = signal(false);
  success = signal('');
  error = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    ]]
  });

  strength = computed(() => {
    const password = this.form.controls.newPassword.value || '';
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  });

  get f() { return this.form.controls; }

  sendOtp(): void {
    this.f.email.markAsTouched();
    if (this.f.email.invalid) return;

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.sendOtp(this.f.email.value!).subscribe({
      next: () => {
        this.step.set(2);
        this.success.set('OTP sent. It will expire soon, so use the latest code from your inbox.');
        this.submitting.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to send OTP.');
        this.submitting.set(false);
      }
    });
  }

  resetPassword(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');

    const { email, otp, newPassword } = this.form.value;
    this.auth.resetPassword({ email: email!, otp: otp!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.auth.clearSession();
        this.success.set('Password reset successfully. Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'OTP expired or invalid. Request a new OTP and try again.');
        this.submitting.set(false);
      }
    });
  }

  resendOtp(): void {
    this.sendOtp();
  }
}

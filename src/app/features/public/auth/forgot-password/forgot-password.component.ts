import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  submitting = false; success = false; error = '';
  get f() { return this.form.controls; }
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.error = '';
    this.auth.sendOtp(this.form.value.email!).subscribe({
      next: () => { this.success = true; this.submitting = false; },
      error: (e) => { this.error = e?.error?.message || 'Failed to send OTP.'; this.submitting = false; }
    });
  }
}

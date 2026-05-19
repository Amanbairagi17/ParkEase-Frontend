import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  status = signal<'idle' | 'verifying' | 'success' | 'error'>('idle');
  error = signal('');
  submitting = signal(false);

  form = this.fb.group({
    token: ['', [Validators.required, Validators.minLength(4)]]
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const success = this.route.snapshot.queryParamMap.get('success');

    if (success === 'true') {
      this.status.set('success');
    } else if (token) {
      this.verifyToken(token);
    } else {
      this.status.set('idle');
    }
  }

  verifyToken(token: string): void {
    this.status.set('verifying');
    this.error.set('');
    this.submitting.set(true);

    this.auth.verify(token).subscribe({
      next: () => {
        this.status.set('success');
        this.submitting.set(false);
      },
      error: (err) => {
        this.status.set('error');
        this.error.set(err?.error?.message || err?.message || 'Verification link is invalid, expired or already verified.');
        this.submitting.set(false);
      }
    });
  }

  submitManual(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const enteredToken = this.form.value.token?.trim();
    if (enteredToken) {
      this.verifyToken(enteredToken);
    }
  }
}

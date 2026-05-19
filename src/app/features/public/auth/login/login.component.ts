import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitting = false;
  error = '';
  message = '';
  year = new Date().getFullYear();

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.message = 'Registration successful! A verification link has been sent to your email. Please check your inbox to activate your account.';
      } else if (params['verified'] === 'true') {
        this.message = 'Email verified successfully! You can now sign in.';
      } else if (params['error']) {
        this.error = params['error'];
      }
    });
  }

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate([this.auth.roleRedirect()]);
      },
      error: (e) => {
        this.error = e?.error?.message || e?.message || 'Login failed. Please try again.';
        this.submitting = false;
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = this.api.gatewayUrl('/oauth2/authorization/google');
  }
}

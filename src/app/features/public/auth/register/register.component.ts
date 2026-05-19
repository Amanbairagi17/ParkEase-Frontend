import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['DRIVER' as User['role'], Validators.required],
  });

  roles = [
    { value: 'DRIVER', label: 'Driver' },
    { value: 'MANAGER', label: 'Lot manager' },
  ];

  submitting = false;
  error = '';
  year = new Date().getFullYear();
  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.error = '';
    const v = this.form.value;
    this.auth.register({
      fullName: v.fullName!,
      email: v.email!,
      password: v.password!,
      phone: v.phone!,
      role: v.role as User['role'],
    }).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { registered: 'true' } }),
      error: (e) => {
        this.error = e?.error?.message || 'Registration failed.';
        this.submitting = false;
      }
    });
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
  // Removed local styleUrls if any conflicts, but will keep standard
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  saving = false;
  success = false;
  error = '';

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    address: [''],
    vehiclePlate: [''],
    vehicleType: ['']
  });

  get user() { return this.auth.currentUser; }
  get initials(): string { 
    return this.user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'; 
  }

  ngOnInit(): void {
    if (this.user) {
      this.form.patchValue({ 
        fullName: this.user.fullName, 
        email: this.user.email, 
        phone: this.user.phone,
        address: this.user.address || '',
        vehiclePlate: this.user.vehiclePlate || '',
        vehicleType: this.user.vehicleType || ''
      });
    }
  }

  save(): void {
    if (this.form.invalid || !this.user) return;
    
    this.saving = true; 
    this.success = false; 
    this.error = '';

    const updateData = this.form.value;
    
    this.userService.updateProfile(this.user.userId, updateData as any)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (updatedUser) => {
          this.auth.updateLocalUser(updatedUser);
          this.success = true;
          this.toast.show('Profile updated successfully!', 'success');
          setTimeout(() => this.success = false, 5000);
        },
        error: (err) => {
          console.error('Profile update failed:', err);
          this.error = err.error?.message || 'Failed to update profile. Please try again.';
          this.toast.show(this.error, 'error');
        }
      });
  }

  logout(): void { 
    this.auth.logout(); 
  }
}

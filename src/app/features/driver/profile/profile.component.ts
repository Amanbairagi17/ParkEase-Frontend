import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/types';
import { finalize } from 'rxjs';
import { guardUserId } from '../../../core/utils/user-id';

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
  uploading = false;
  deleting = false;
  dragActive = false;
  fileError = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private readonly maxFileBytes = 5 * 1024 * 1024;

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

  get avatarUrl(): string | null {
    return this.previewUrl || this.user?.profilePicUrl || null;
  }

  get selectedFileSize(): string {
    if (!this.selectedFile) return '';
    const mb = this.selectedFile.size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
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
    if (this.form.invalid) return;
    const userId = guardUserId(this.user?.userId ?? this.auth.getUserIdFromToken(), 'ProfileComponent.save');
    if (userId === null) {
      this.error = 'Invalid user ID. Please sign in again.';
      this.toast.show(this.error, 'error');
      return;
    }
    
    this.saving = true; 
    this.success = false; 
    this.error = '';

    const updateData = this.form.value;
    
    this.userService.updateProfile(userId, updateData as any)
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
      input.value = '';
    }
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.fileError = '';
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) return;
    const userId = guardUserId(this.user?.userId ?? this.auth.getUserIdFromToken(), 'ProfileComponent.uploadProfilePicture');
    if (userId === null) {
      this.fileError = 'Invalid user ID. Please sign in again.';
      this.toast.show(this.fileError, 'error');
      return;
    }

    this.uploading = true;
    this.fileError = '';

    this.userService.uploadProfilePicture(userId, this.selectedFile)
      .pipe(finalize(() => this.uploading = false))
      .subscribe({
        next: (updatedUser) => {
          if (updatedUser) {
            const nextUser = (updatedUser as any).user || updatedUser;
            this.applyUserUpdate(nextUser as Partial<User>);
          }
          this.toast.show('Profile picture updated.', 'success');
          this.clearSelection();
        },
        error: (err) => {
          console.error('Profile picture upload failed:', err);
          this.fileError = err.error?.message || 'Failed to upload profile picture.';
          this.toast.show(this.fileError, 'error');
        }
      });
  }

  deleteProfilePicture(): void {
    const userId = guardUserId(this.user?.userId ?? this.auth.getUserIdFromToken(), 'ProfileComponent.deleteProfilePicture');
    if (userId === null) {
      this.fileError = 'Invalid user ID. Please sign in again.';
      this.toast.show(this.fileError, 'error');
      return;
    }

    this.deleting = true;
    this.userService.deleteProfilePicture(userId)
      .pipe(finalize(() => this.deleting = false))
      .subscribe({
        next: (updatedUser) => {
          if (updatedUser) {
            const nextUser = (updatedUser as any).user || updatedUser;
            this.applyUserUpdate(nextUser as Partial<User>);
          } else {
            this.applyUserUpdate({ profilePicUrl: undefined });
          }
          this.toast.show('Profile picture removed.', 'success');
          this.clearSelection();
        },
        error: (err) => {
          console.error('Profile picture delete failed:', err);
          this.fileError = err.error?.message || 'Failed to remove profile picture.';
          this.toast.show(this.fileError, 'error');
        }
      });
  }

  private handleFiles(files: FileList): void {
    this.fileError = '';
    const file = files.item(0);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.fileError = 'Only image files are allowed.';
      return;
    }

    if (file.size > this.maxFileBytes) {
      this.fileError = 'File size must be 5 MB or less.';
      return;
    }

    this.selectedFile = file;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
  }

  private applyUserUpdate(update: Partial<User>): void {
    if (!this.user) return;
    this.auth.updateLocalUser({ ...this.user, ...update } as User);
  }

  logout(): void { 
    this.auth.logout(); 
  }
}

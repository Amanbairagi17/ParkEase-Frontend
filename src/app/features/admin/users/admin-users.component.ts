import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminUser, WarnUserRequest } from '../../../core/models/types';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  loading = true;
  searchTerm = '';
  roleFilter = 'ALL';

  // For warning modal
  selectedUser: AdminUser | null = null;
  warningTitle = '';
  warningMessage = '';
  showWarningModal = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.adminService.getUsers().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.toast.error('Failed to load users');
      }
    });
  }

  applyFilters(): void {
    let result = this.users;

    if (this.roleFilter !== 'ALL') {
      result = result.filter(u => u.role === this.roleFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = result;
    this.cdr.detectChanges();
  }

  onRoleFilterChange(role: string): void {
    this.roleFilter = role;
    this.applyFilters();
  }

  toggleSuspend(user: AdminUser): void {
    const action = user.isActive ? this.adminService.suspendUser(user.userId) : this.adminService.reactivateUser(user.userId);
    const label = user.isActive ? 'Suspend' : 'Reactivate';

    if (!confirm(`Are you sure you want to ${label.toLowerCase()} ${user.fullName}?`)) return;

    action.subscribe({
      next: () => {
        this.toast.success(`User ${label.toLowerCase()}ed successfully`);
        user.isActive = !user.isActive;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(`Failed to ${label.toLowerCase()} user`);
      }
    });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`CRITICAL: Are you sure you want to PERMANENTLY DELETE ${user.fullName}? This cannot be undone.`)) return;

    this.adminService.deleteUser(user.userId).subscribe({
      next: () => {
        this.toast.success('User deleted successfully');
        this.users = this.users.filter(u => u.userId !== user.userId);
        this.applyFilters();
      },
      error: (err) => {
        this.toast.error('Failed to delete user');
      }
    });
  }

  openWarningModal(user: AdminUser): void {
    this.selectedUser = user;
    this.warningTitle = 'System Warning';
    this.warningMessage = '';
    this.showWarningModal = true;
  }

  closeWarningModal(): void {
    this.showWarningModal = false;
    this.selectedUser = null;
  }

  sendWarning(): void {
    if (!this.selectedUser || !this.warningTitle || !this.warningMessage) return;

    const request: WarnUserRequest = {
      title: this.warningTitle,
      message: this.warningMessage
    };

    this.adminService.warnUser(this.selectedUser.userId, request).subscribe({
      next: () => {
        this.toast.success('Warning sent successfully');
        this.closeWarningModal();
      },
      error: () => this.toast.error('Failed to send warning')
    });
  }
}

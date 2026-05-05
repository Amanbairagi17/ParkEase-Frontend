import { Component, inject, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/types';
import { Subject, filter, takeUntil } from 'rxjs';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css']
})
export class AppShellComponent implements OnInit, OnDestroy {
  @Input() navItems: NavItem[] = [];
  auth = inject(AuthService);
  router = inject(Router);

  private destroy$ = new Subject<void>();
  sidebarOpen = false;

  ngOnInit(): void {
    // Force light theme (dark mode removed)
    document.body.classList.remove('dark');
    localStorage.removeItem('parkease.theme');

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.sidebarOpen = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onEsc(event: Event): void {
    if ((event as KeyboardEvent).key === 'Escape') {
      this.sidebarOpen = false;
    }
  }

  get user(): User | null { return this.auth.currentUser; }
  get initials(): string {
    return this.user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U';
  }

  logout(): void { this.auth.logout(); }
}

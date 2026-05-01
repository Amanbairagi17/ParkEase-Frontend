import { Component, inject, Input, OnInit, OnDestroy, HostListener, Renderer2 } from '@angular/core';
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
  renderer = inject(Renderer2);

  private destroy$ = new Subject<void>();
  sidebarOpen = false;
  isDarkMode = false;

  ngOnInit(): void {
    // Load theme preference
    const savedTheme = localStorage.getItem('parkease.theme');
    if (savedTheme === 'dark') {
      this.enableDarkMode();
    }

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

  toggleDarkMode(): void {
    if (this.isDarkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  private enableDarkMode(): void {
    this.isDarkMode = true;
    this.renderer.addClass(document.body, 'dark');
    localStorage.setItem('parkease.theme', 'dark');
  }

  private disableDarkMode(): void {
    this.isDarkMode = false;
    this.renderer.removeClass(document.body, 'dark');
    localStorage.setItem('parkease.theme', 'light');
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
